// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { HTTPStatus } from './status.ts'
import { ContentType } from './media.ts'
import { createMatcher, HTMLErrorTemplate, normalizePath } from './util.ts'
import { HTTPResponse, HTTPResponseOptions } from './httpresponse.ts'
import type { Middleware } from './middleware.ts'
import { serveStatic } from './static.ts'
import { error500, HTTPError } from './error.ts'

export type RouterOptions = Omit<HTTPResponseOptions, 'body'>

export type HTTPMethod =
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'CONNECT'

export const defaultOptions: RouterOptions = {
    type: ContentType.PLAIN,
    status: HTTPStatus.SUCCESS,
}

export type RouteParams = Record<string, string>

export type RoutePath = string | RegExp

export interface HandlerOptions {
    path: RoutePath
    methods: string[]
    middleware: Middleware
    static: boolean
    routerOptions?: RouterOptions
    root: string
}

export class RouteHandler {
    path: RoutePath
    methods: string[]
    middleware: Middleware
    static: boolean
    options?: RouterOptions
    root: string

    constructor(options: HandlerOptions) {
        this.path = options.path
        this.methods = options.methods
        this.middleware = options.middleware
        this.static = options.static
        this.options = options.routerOptions
        this.root = options.root
    }

    public match(path: string, method: string): boolean {
        const relativePath = this.root === '/'
            ? path
            : (normalizePath(path.split(this.root)[1] || '/') as string)

        if (
            (this.methods.includes(method) || this.methods.length === 0) &&
            path.startsWith(this.root)
        ) {
            if (this.path instanceof RegExp) {
                return this.path.test(relativePath)
            } else if (
                this.path === '*' ||
                (path === this.path && path === '/') ||
                (this.static && path.startsWith(this.path))
            ) {
                return true
            }

            const match = createMatcher(this.path)
            return Boolean(match(relativePath))
        }
        return false
    }
}

export class Router {
    readonly #options: RouterOptions
    readonly #handlers: RouteHandler[] = []

    constructor(options = defaultOptions) {
        this.#options = options
    }

    public getHandlers = (): RouteHandler[] => [...this.#handlers]

    protected register = (
        methods: HTTPMethod | HTTPMethod[],
        path: RoutePath,
        middlewares: Middleware[],
        isStatic = false,
    ): void => {
        for (const middleware of middlewares) {
            const handler = new RouteHandler({
                path: normalizePath(path),
                root: '/',
                middleware,
                static: isStatic,
                methods: typeof methods === 'string' ? [methods] : methods,
                routerOptions: this.#options,
            })
            this.#handlers.push(handler)
        }
    }

    public GET = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('GET', path, middlewares)
        return this
    }

    public POST = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('POST', path, middlewares)
        return this
    }

    public PUT = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('PUT', path, middlewares)
        return this
    }

    public PATCH = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('PATCH', path, middlewares)
        return this
    }

    public DELETE = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('DELETE', path, middlewares)
        return this
    }

    public HEAD = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('HEAD', path, middlewares)
        return this
    }

    public OPTIONS = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('OPTIONS', path, middlewares)
        return this
    }

    public CONNECT = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('CONNECT', path, middlewares)
        return this
    }

    public all = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register([], path, middlewares)
        return this
    }

    public static = (path: string, dir: string): Router => {
        const middleware: Middleware = async (context) => {
            const url = context.request.url
            try {
                return await serveStatic(url, path, dir)
            } catch (error) {
                if (error instanceof HTTPError) {
                    return new HTTPResponse({
                        status: error.code,
                        type: 'text/html; charset=UTF-8',
                        body: HTMLErrorTemplate(error),
                    })
                }
                return error500
            }
        }

        this.register('GET', path, [middleware], true)
        return this
    }
}
