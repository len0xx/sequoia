// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { RouteHandler, Router } from './router.ts'
import { Context } from './context.ts'
import { combineMiddlewares, type Middleware } from './middleware.ts'
import {
    defaultErrorHandler,
    ErrorHandler,
    InternalError,
    NotFoundError,
    SequoiaError,
} from './error.ts'
import { getRemoteAddress, normalizePath, outputHandlers, responseLog } from './util.ts'

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
    port: 8000,
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
    #server: Deno.HttpServer | undefined = undefined
    #handleError = defaultErrorHandler
    readonly #handlers: RouteHandler[] = []

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
                const handler = new RouteHandler({
                    root: typeof pathOrMiddlewares === 'string' ? pathOrMiddlewares : '/',
                    path: '*',
                    middleware: middle,
                    static: false,
                    methods: [],
                })
                this.#handlers.push(handler)
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
            const root = normalizePath(pathOrRouter) as string
            this.#handlers.push(
                ...router
                    .getHandlers()
                    .map((handler) => {
                        handler.root = root
                        return handler
                    }),
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

    protected matchHandlers = (request: Request): RouteHandler[] => {
        return this.#handlers.filter((handler) =>
            handler.match(
                new URL(request.url).pathname,
                request.method.toUpperCase(),
            )
        )
    }

    protected handle = async (
        request: Request,
        info: Deno.ServeHandlerInfo,
    ): Promise<Response> => {
        const remote = getRemoteAddress(info)
        if (this.isLoggingEnabled()) {
            this.log('Request', `[${remote.hostname}]:`, request.method, request.url)
        }
        const context = new Context(request)

        if (this.#handlers.length) {
            const handlers = this.matchHandlers(request)

            if (handlers.length) {
                const path = new URL(request.url).pathname
                const middleware = combineMiddlewares(
                    path,
                    handlers,
                    this.#handleError,
                )

                const response = await middleware(context)

                if (response) {
                    response.applyCookies(context.cookies)

                    if (this.isLoggingEnabled()) {
                        this.log('Matched handlers:')
                        this.dir(handlers.map(outputHandlers))
                        this.log(responseLog(response))
                    }

                    return response.transform()
                }
            }
            const response = await this.#handleError(context, new NotFoundError('Not found'))
            if (this.isLoggingEnabled()) this.log(responseLog(response))
            return response.transform()
        }
        throw new SequoiaError('No listeners are defined for the application')
    }

    protected handleHTTP = async (
        request: Request,
        info: Deno.ServeHandlerInfo,
    ): Promise<Response> => {
        let response: Response | null = null

        try {
            response = await this.handle(request, info)
        } catch (error) {
            console.error(error)
            const internalError = new InternalError('Internal server error')
            const errResponse = await this.#handleError(new Context(request), internalError)
            if (this.isLoggingEnabled()) this.log(responseLog(errResponse))
            response = errResponse.transform()
        }

        return response as Response
    }

    public listen = (
        configuration: Partial<ServerConfiguration> = SERVER_CONFIG,
        callback?: () => void,
    ): void => {
        if (!this.#listening) {
            this.#serverConfiguration = {
                ...SERVER_CONFIG,
                ...configuration,
            }
            const config = this.#serverConfiguration

            this.#listening = true
            if (this.isLoggingEnabled()) {
                this.log(
                    `Starting an HTTP server at http://${config.hostname}:${config.port}`,
                )
            }

            const serveOptions: Deno.ServeOptions = {
                hostname: config.hostname,
                port: config.port,
                signal: config.signal,
                onListen: callback || (() => undefined),
            }

            this.#server = Deno.serve(serveOptions, this.handleHTTP)
        } else {
            throw new SequoiaError(
                'Can not start listening because this instance is already listening!',
            )
        }
    }

    public shutdown = async (): Promise<void> => {
        if (this.#listening && this.#server) {
            await this.#server.shutdown()
            this.#listening = false
            this.#server = undefined
        }
    }

    protected isLoggingEnabled: () => boolean = () =>
        !!(this.#configuration.logging && this.#configuration.logger)

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
