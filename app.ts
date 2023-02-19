// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { Router } from './router.ts'
import { Context } from './context.ts'
import { combineMiddlewares, type Middleware } from './middleware.ts'
import { defaultErrorHandler, error404, error500, ErrorHandler, SequoiaError } from './error.ts'
import { createMatcher, getRemoteAddress, outputHandlers, responseLog } from './util.ts'
import type { HTTPHandler } from './middleware.ts'

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

export class Application {
    #configuration: AppConfiguration
    #serverConfiguration = SERVER_CONFIG
    #listening = false
    #listener: Deno.Listener | undefined
    #handleError = defaultErrorHandler
    readonly #handlers: HTTPHandler[] = []

    constructor(configuration: Partial<AppConfiguration> = APP_CONFIG) {
        this.#configuration = { ...APP_CONFIG, ...configuration }
    }

    public use = (...middlewares: Middleware[]) => {
        for (const middle of middlewares) {
            this.#handlers.push({
                path: '*',
                middleware: middle,
                static: false,
                methods: [],
            } as HTTPHandler)
        }
    }

    public useRouter = (router: Router) => {
        this.#handlers.push(...router.getHandlers())
    }

    public handleErrors = (handler: ErrorHandler) => {
        this.#handleError = handler
    }

    protected checkHandler = (handler: HTTPHandler, path: string, method: string): boolean => {
        if (handler.methods.includes(method) || handler.methods.length === 0) {
            if (handler.path instanceof RegExp) {
                return handler.path.test(path)
            } else if (
                handler.path === '*' ||
                path === handler.path && path === '/' ||
                handler.static && path.startsWith(handler.path)
            ) return true

            const match = createMatcher(handler.path)
            return Boolean(match(path))
        }
        return false
    }

    protected matchHandlers = (request: Request) => {
        return this.#handlers.filter(
            (handler) =>
                this.checkHandler(
                    handler,
                    new URL(request.url).pathname,
                    request.method.toUpperCase(),
                ),
        )
    }

    protected handle = async (request: Request, connection: Deno.Conn): Promise<Response> => {
        const remote = getRemoteAddress(connection)
        this.log('Request', `[${remote.hostname}]:`, request.method, request.url)

        if (this.#handlers.length) {
            const handlers = this.matchHandlers(request)

            if (handlers.length) {
                const context = new Context(request)
                const path = new URL(request.url).pathname
                const middleware = combineMiddlewares(path, handlers, this.#handleError)

                const response = await middleware(context)
                response.applyCookies(context.cookies)

                this.log('Matched handlers:')
                this.dir(handlers.map(outputHandlers))
                this.log(responseLog(response))

                if (!response.empty()) return response.transform()
            }
            const response = error404
            this.log(responseLog(response))
            return response.transform()
        }
        throw new SequoiaError('No listeners are defined for the application')
    }

    protected handleHTTP = async (conn: Deno.Conn) => {
        for await (const event of Deno.serveHttp(conn)) {
            let response: Response | undefined

            try {
                response = await this.handle(event.request, conn)
            } catch (error) {
                console.error(error)
                const res = error500
                response = res.transform()
                this.log(responseLog(res))
            } finally {
                await event.respondWith(response!)
            }
        }
    }

    public listen = async (
        configuration: Partial<ServerConfiguration> = SERVER_CONFIG,
        callback?: () => void,
    ) => {
        if (!this.#listening) {
            this.#serverConfiguration = {
                ...SERVER_CONFIG,
                ...configuration,
            }
            const config = this.#serverConfiguration

            this.#listener = Deno.listen(config)
            this.#listening = true
            this.log(
                `Starting an HTTP server at http://${config.hostname}:${config.port}`,
            )
            if (callback) callback()

            if (config.signal) {
                config.signal.addEventListener('abort', () => {
                    this.close()
                })
            }

            for await (const conn of this.#listener) {
                this.handleHTTP(conn)
            }
        } else {
            throw new SequoiaError(
                'Can not start listening because this instance is already listening!',
            )
        }
    }

    public close = () => {
        if (this.#listener && this.#listening) {
            this.#listener.close()
            this.#listening = false
        } else {
            throw new SequoiaError('The application is not listening yet')
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

        if (config.logging && config.logger) {
            if (config.date) {
                config.logger(date, ':', ...data)
            } else {
                config.logger(...data)
            }
        }
    }

    // deno-lint-ignore no-explicit-any
    protected dir = (item: any, options?: any): void => {
        if (this.#configuration.logging) console.dir(item, options)
    }
}
