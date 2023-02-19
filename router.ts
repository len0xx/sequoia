// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { HTTPStatus } from './status.ts'
import { ContentType } from './media.ts'
import { HTMLErrorTemplate, normalizePath } from './util.ts'
import { HTTPResponse, HTTPResponseOptions } from './httpresponse.ts'
import type { HTTPHandler, Middleware } from './middleware.ts'
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

export class Router {
    readonly #options: RouterOptions
    readonly #handlers: HTTPHandler[] = []

    constructor(options = defaultOptions) {
        this.#options = options
    }

    public getHandlers = (): HTTPHandler[] => [...this.#handlers]

    protected register = (
        methods: HTTPMethod | HTTPMethod[],
        path: RoutePath,
        middlewares: Middleware[],
        isStatic = false,
    ): void => {
        for (const middleware of middlewares) {
            this.#handlers.push({
                path,
                middleware,
                static: isStatic,
                methods: typeof methods === 'string' ? [methods] : methods,
                options: this.#options,
            })
        }
    }

    public GET = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('GET', normalizePath(path), middlewares)
        return this
    }

    public POST = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('POST', normalizePath(path), middlewares)
        return this
    }

    public PUT = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('PUT', normalizePath(path), middlewares)
        return this
    }

    public PATCH = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('PATCH', normalizePath(path), middlewares)
        return this
    }

    public DELETE = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('DELETE', normalizePath(path), middlewares)
        return this
    }

    public HEAD = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('HEAD', normalizePath(path), middlewares)
        return this
    }

    public OPTIONS = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('OPTIONS', normalizePath(path), middlewares)
        return this
    }

    public CONNECT = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register('CONNECT', normalizePath(path), middlewares)
        return this
    }

    public all = (path: RoutePath, ...middlewares: Middleware[]): Router => {
        this.register([], normalizePath(path), middlewares)
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

        this.register('GET', normalizePath(path), [middleware], true)
        return this
    }
}
