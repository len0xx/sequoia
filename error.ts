// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { Status } from './deps.ts'
import { Context } from './context.ts'
import { HTTPStatus } from './status.ts'
import { HTMLErrorTemplate } from './util.ts'
import { HTTPResponse } from './httpresponse.ts'

export class SequoiaError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SequoiaError'
    }
}

export class HTTPError extends Error {
    readonly code: HTTPStatus | Status

    constructor(code: HTTPStatus | Status, message: string) {
        super(message)
        this.name = 'HTTPError'
        this.code = code
    }
}

export type ErrorHandler = (
    context: Context,
    error: HTTPError,
) => Promise<HTTPResponse> | HTTPResponse

export const defaultErrorHandler: ErrorHandler = (_: Context, error: HTTPError) => {
    return new HTTPResponse({
        status: error.code,
        type: 'text/html; charset=UTF-8',
        body: HTMLErrorTemplate(error),
    })
}

export const error400 = new HTTPResponse({
    status: HTTPStatus.BAD_REQUEST,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new HTTPError(
            HTTPStatus.BAD_REQUEST,
            'Bad request',
        ),
    ),
})

export const error403 = new HTTPResponse({
    status: HTTPStatus.FORBIDDEN,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new HTTPError(
            HTTPStatus.FORBIDDEN,
            'Forbidden',
        ),
    ),
})

export const error404 = new HTTPResponse({
    status: HTTPStatus.NOT_FOUND,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new HTTPError(
            HTTPStatus.NOT_FOUND,
            'The page was not found',
        ),
    ),
})

export const error500 = new HTTPResponse({
    status: HTTPStatus.INTERNAL_ERROR,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new HTTPError(
            HTTPStatus.INTERNAL_ERROR,
            'Internal server error',
        ),
    ),
})
