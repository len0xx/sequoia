// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { Context } from './context.ts'
import { HTTPResponse } from './httpresponse.ts'
import { HTTPContextRequest } from './httprequest.ts'
import { extractParams, mergeResponses } from './util.ts'
import { defaultErrorHandler, ErrorHandler, HTTPError, SequoiaError } from './error.ts'
import type { RouteHandler, RouteParams } from './router.ts'

export type SyncMiddlewareReturn = HTTPResponse | undefined | void
export type AsyncMiddlewareReturn = Promise<HTTPResponse | undefined | void>

export type MiddlewareReturn = SyncMiddlewareReturn | AsyncMiddlewareReturn

export type Middleware = <
    ParamsT extends RouteParams = RouteParams,
    RequestT extends HTTPContextRequest<ParamsT> = HTTPContextRequest<ParamsT>,
>(
    context: Context<ParamsT, RequestT>,
    next: NextMiddleware,
) => MiddlewareReturn

export type NextMiddleware = () => MiddlewareReturn

export function combineMiddlewares(
    path: string,
    handlers: RouteHandler[],
    errorHandler: ErrorHandler = defaultErrorHandler,
): (context: Context) => MiddlewareReturn {
    return (context: Context) => {
        const middlewares = handlers.map(
            (handler) => handler.middleware,
        ).reverse()
        let index = middlewares.length

        const action = async (i: number): AsyncMiddlewareReturn => {
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

            if (response) mergeResponses(context, response, handler.options)
            return context.response
        }

        return action(middlewares.length - 1)
    }
}
