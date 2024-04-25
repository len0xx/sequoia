// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { Context } from './context.ts'
import { HTTPResponse } from './httpresponse.ts'
import { HTTPContextRequest } from './httprequest.ts'
import { combineHeaders, extractParams } from './util.ts'
import { defaultErrorHandler, ErrorHandler, HTTPError, SequoiaError } from './error.ts'
import type { RouteParams, RoutePath, RouterOptions } from './router.ts'

export type MiddlewareReturn =
    | Promise<HTTPResponse>
    | HTTPResponse
    | Promise<undefined>
    | undefined
    | Promise<void>
    | void

export type Middleware = <
    ParamsT extends RouteParams = RouteParams,
    RequestT extends HTTPContextRequest<ParamsT> = HTTPContextRequest<ParamsT>,
>(
    context: Context<ParamsT, RequestT>,
    next: NextMiddleware,
) => MiddlewareReturn

export type NextMiddleware = () => MiddlewareReturn

export interface HTTPHandler {
    path: RoutePath
    methods: string[]
    middleware: Middleware
    static: boolean
    options?: RouterOptions
    root: string
}

export function combineMiddlewares(
    path: string,
    handlers: HTTPHandler[],
    errorHandler: ErrorHandler = defaultErrorHandler,
): (context: Context) => MiddlewareReturn {
    return (context: Context) => {
        const middlewares = handlers.map(
            (handler) => handler.middleware,
        ).reverse()
        let index = middlewares.length

        const action = async (i: number): Promise<HTTPResponse> => {
            if (i >= index) {
                throw new SequoiaError('next() called multiple times')
            }

            index = i
            const forwardIndex = middlewares.length - 1 - i
            const fn: Middleware | undefined = middlewares[i]
            if (!fn) {
                return context.response
            }

            const handler = handlers[forwardIndex]
            context.request.params = extractParams(handler, path)

            let response: HTTPResponse | undefined = undefined
            try {
                response = await fn(
                    context,
                    action.bind(null, i - 1),
                ) as HTTPResponse | undefined
            } catch (error) {
                if (error instanceof HTTPError) {
                    response = await errorHandler(context, error)
                } else {
                    throw error
                }
            }

            if (response) {
                const headers = [
                    response.headers,
                    handler.options?.headers,
                    context.response.headers,
                ].filter(
                    (entry) => entry && entry instanceof Headers && Array.from(entry.keys()).length,
                ) as Headers[]

                context.response.body = response.body
                context.response.headers = combineHeaders(...headers)
                context.response.type = response.type || handler.options?.type
                context.response.status = response.status || handler.options?.status
            }

            return context.response
        }

        return action(middlewares.length - 1)
    }
}
