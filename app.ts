// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { Router } from './router.ts'
import { Context } from './context.ts'
import { combineMiddlewares, type HTTPHandler, type Middleware } from './middleware.ts'
import { defaultErrorHandler, error404, error500, ErrorHandler, SequoiaError } from './error.ts'
import {
    createMatcher,
    getRemoteAddress,
    normalizePath,
    outputHandlers,
    responseLog,
} from './util.ts'
import { HTTPResponse } from './httpresponse.ts'

export interface AppConfiguration {
    logging: boolean
    // deno-lint-ignore no-explicit-any
    logger: (...data: any[]) => void
    date: boolean
}

export interface ServerConfiguration {
    hostname: string
    port: number
    signal?: AbortSignal
}

const APP_CONFIG: AppConfiguration = {
    logging: false,
    logger: console.log,
    date: true,
}
const SERVER_CONFIG: ServerConfiguration = {
    hostname: '127.0.0.1',
    port: 80,
}

export type UseMethod = {
    (path: string, ...middlewares: Middleware[]): void
    (...middlewares: Middleware[]): void
}

export type UseRouterMethod = {
    (path: string, router: Router): void
    (router: Router): void
}

export class Application {
    #configuration: AppConfiguration
    #serverConfiguration = SERVER_CONFIG
    #listening = false
    #handleError = defaultErrorHandler
    readonly #handlers: HTTPHandler[] = []

    constructor(configuration: Partial<AppConfiguration> = APP_CONFIG) {
        this.#configuration = { ...APP_CONFIG, ...configuration }
    }

    public use: UseMethod = (
        pathOrMiddlewares: string | Middleware,
        ...middlewares: Middleware[]
    ): void => {
        const middles: Middleware[] = []

        if (typeof pathOrMiddlewares === 'string') {
            middles.push(...middlewares)
        } else {
            middles.push(...[pathOrMiddlewares, ...middlewares])
        }

        for (const middle of middles) {
            if (typeof middle === 'function') {
                this.#handlers.push({
                    root: typeof pathOrMiddlewares === 'string' ? pathOrMiddlewares : '/',
                    path: '*',
                    middleware: middle,
                    static: false,
                    methods: [],
                } as HTTPHandler)
            } else {
                throw new SequoiaError(
                    'Only functions may be passed to this method as middlwares',
                )
            }
        }
    }

    public useRouter: UseRouterMethod = (
        pathOrRouter: string | Router,
        router?: Router | undefined,
    ): void => {
        if (pathOrRouter && pathOrRouter instanceof Router) {
            this.#handlers.push(...pathOrRouter.getHandlers())
        } else if (
            pathOrRouter &&
            router &&
            typeof pathOrRouter === 'string' &&
            router instanceof Router
        ) {
            const root = normalizePath(pathOrRouter)
            this.#handlers.push(
                ...router
                    .getHandlers()
                    .map((handler) => ({ ...handler, root }) as HTTPHandler),
            )
        } else {
            throw new SequoiaError(
                'Unexpected parameter types for Application.useRouter(). Check documentation for more information',
            )
        }
    }

    public handleErrors = (handler: ErrorHandler): void => {
        this.#handleError = handler
    }

    protected checkHandler = (
        handler: HTTPHandler,
        path: string,
        method: string,
    ): boolean => {
        const relativePath = handler.root === '/'
            ? path
            : (normalizePath(path.split(handler.root)[1] || '/') as string)

        if (
            (handler.methods.includes(method) || handler.methods.length === 0) &&
            path.startsWith(handler.root)
        ) {
            if (handler.path instanceof RegExp) {
                return handler.path.test(relativePath)
            } else if (
                handler.path === '*' ||
                (path === handler.path && path === '/') ||
                (handler.static && path.startsWith(handler.path))
            ) {
                return true
            }

            const match = createMatcher(handler.path)
            return Boolean(match(relativePath))
        }
        return false
    }

    protected matchHandlers = (request: Request): HTTPHandler[] => {
        return this.#handlers.filter((handler) =>
            this.checkHandler(
                handler,
                new URL(request.url).pathname,
                request.method.toUpperCase(),
            )
        )
    }

    protected handle = async (
        request: Request,
        info: Deno.ServeHandlerInfo,
    ): Promise<Response> => {
        const loggingEnabled = this.#configuration.logging && this.#configuration.logger
        const remote = getRemoteAddress(info)
        if (loggingEnabled) this.log('Request', `[${remote.hostname}]:`, request.method, request.url)

        if (this.#handlers.length) {
            const handlers = this.matchHandlers(request)

            if (handlers.length) {
                const context = new Context(request)
                const path = new URL(request.url).pathname
                const middleware = combineMiddlewares(
                    path,
                    handlers,
                    this.#handleError,
                )

                const response = (await middleware(context)) as HTTPResponse
                response.applyCookies(context.cookies)

                if (loggingEnabled) {
                    this.log('Matched handlers:')
                    this.dir(handlers.map(outputHandlers))
                    this.log(responseLog(response))
                }

                if (!response.empty()) return response.transform()
            }
            const response = error404
            if (loggingEnabled) this.log(responseLog(response))
            return response.transform()
        }
        throw new SequoiaError('No listeners are defined for the application')
    }

    protected handleHTTP = async (
        request: Request,
        info: Deno.ServeHandlerInfo,
    ): Promise<Response> => {
        const loggingEnabled = this.#configuration.logging && this.#configuration.logger
        let response: Response | null = null

        try {
            response = await this.handle(request, info)
        } catch (error) {
            console.error(error)
            if (loggingEnabled) this.log(responseLog(error500))
            response = error500.transform()
        }

        return response as Response
    }

    public listen = (
        configuration: Partial<ServerConfiguration> = SERVER_CONFIG,
        callback?: () => void,
    ): void => {
        if (!this.#listening) {
            const loggingEnabled = this.#configuration.logging && this.#configuration.logger
            this.#serverConfiguration = {
                ...SERVER_CONFIG,
                ...configuration,
            }
            const config = this.#serverConfiguration

            this.#listening = true
            if (loggingEnabled) this.log(
                `Starting an HTTP server at http://${config.hostname}:${config.port}`,
            )

            const serveOptions: Deno.ServeOptions = {
                hostname: config.hostname,
                port: config.port,
                signal: config.signal,
                onListen: callback,
            }

            Deno.serve(serveOptions, this.handleHTTP)
        } else {
            throw new SequoiaError(
                'Can not start listening because this instance is already listening!',
            )
        }
    }

    // deno-lint-ignore no-explicit-any
    protected log = (...data: any[]): void => {
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        } as Intl.DateTimeFormatOptions
        const date = new Date().toLocaleDateString('ru', options)
        const config = this.#configuration

        if (config.date) {
            config.logger(date, ':', ...data)
        } else {
            config.logger(...data)
        }
    }

    // deno-lint-ignore no-explicit-any
    protected dir = (item: any, options?: any): void => {
        console.dir(item, options)
    }
}
