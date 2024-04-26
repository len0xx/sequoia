// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { Context } from './context.ts'
import { HTTPStatus } from './status.ts'
import { HTMLErrorTemplate } from './util.ts'
import { HTTPResponse } from './httpresponse.ts'
import { ContentType } from './media.ts'

export class SequoiaError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'SequoiaError'
    }
}

export class HTTPError extends Error {
    readonly code: HTTPStatus

    constructor(code: HTTPStatus, message: string) {
        super(message)
        this.name = 'HTTPError'
        this.code = code
    }
}

export class BadRequestError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.BAD_REQUEST, message)
        this.name = 'BadRequestError'
    }
}

export class UnauthorizedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.UNAUTHORIZED, message)
        this.name = 'UnauthorizedError'
    }
}

export class PaymentRequiredError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.PAYMENT_REQUIRED, message)
        this.name = 'PaymentRequiredError'
    }
}

export class ForbiddenError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.FORBIDDEN, message)
        this.name = 'ForbiddenError'
    }
}

export class NotFoundError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NOT_FOUND, message)
        this.name = 'NotFoundError'
    }
}

export class NotAllowedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NOT_ALLOWED, message)
        this.name = 'NotAllowedError'
    }
}

export class NotAcceptableError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NOT_ACCEPTABLE, message)
        this.name = 'NotAcceptableError'
    }
}

export class ProxyAuthRequiredError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.PROXY_AUTH_REQUIRED, message)
        this.name = 'ProxyAuthRequiredError'
    }
}

export class TimeoutError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.TIMEOUT, message)
        this.name = 'TimeoutError'
    }
}

export class ConflictError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.CONFLICT, message)
        this.name = 'ConflictError'
    }
}

export class GoneError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.GONE, message)
        this.name = 'GoneError'
    }
}

export class LengthRequiredError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.LENGTH_REQUIRED, message)
        this.name = 'LengthRequiredError'
    }
}

export class PreconditionFailedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.PRECONDITION_FAILED, message)
        this.name = 'PreconditionFailedError'
    }
}

export class PayloadTooLargeError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.PAYLOAD_TOO_LARGE, message)
        this.name = 'PayloadTooLargeError'
    }
}

export class UriTooLongError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.URI_TOO_LONG, message)
        this.name = 'UriTooLongError'
    }
}

export class UnsupportedMediaError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.UNSUPPORTED_MEDIA, message)
        this.name = 'UnsupportedMediaError'
    }
}

export class RangeNotSatisfiedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.RANGE_NOT_SATISFIED, message)
        this.name = 'RangeNotSatisfiedError'
    }
}

export class ExpectationFailedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.EXPECTATION_FAILED, message)
        this.name = 'ExpectationFailedError'
    }
}

export class TeapotError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.IM_A_TEAPOT, message)
        this.name = 'TeapotError'
    }
}

export class MisdirectedRequestError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.MISDIRECTED_REQUEST, message)
        this.name = 'MisdirectedRequestError'
    }
}

export class UnsupportedEntityError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.UNSUPPORTED_ENTITY, message)
        this.name = 'UnsupportedEntityError'
    }
}

export class LockedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.LOCKED, message)
        this.name = 'LockedError'
    }
}

export class FailedDependencyError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.FAILED_DEPENDENCY, message)
        this.name = 'FailedDependencyError'
    }
}

export class TooEarlyError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.TOO_EARLY, message)
        this.name = 'TooEarlyError'
    }
}

export class UpgradeRequiredError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.UPGRADE_REQUIRED, message)
        this.name = 'UpgradeRequiredError'
    }
}

export class PreconditionRequiredError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.PRECONDITION_REQUIRED, message)
        this.name = 'PreconditionRequiredError'
    }
}

export class TooManyRequestsError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.TOO_MANY_REQUESTS, message)
        this.name = 'TooManyRequestsError'
    }
}

export class HeadersFieldsTooLargeError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.HEADERS_FIELDS_TOO_LARGE, message)
        this.name = 'HeadersFieldsTooLargeError'
    }
}

export class UnavailableError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.UNAVAILABLE, message)
        this.name = 'UnavailableError'
    }
}

export class InternalError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.INTERNAL_ERROR, message)
        this.name = 'InternalError'
    }
}

export class NotImplementedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NOT_IMPLEMENTED, message)
        this.name = 'NotImplementedError'
    }
}

export class BadGatewayError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.BAD_GATEWAY, message)
        this.name = 'BadGatewayError'
    }
}

export class ServiceUnavailableError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.SERVICE_UNAVAILABLE, message)
        this.name = 'ServiceUnavailableError'
    }
}

export class GatewayTimeoutError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.GATEWAY_TIMEOUT, message)
        this.name = 'GatewayTimeoutError'
    }
}

export class HttpVersionNotSupportedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.HTTP_VERSION_NOT_SUPPORTED, message)
        this.name = 'HttpVersionNotSupportedError'
    }
}

export class VariantNegotiatesError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.VARIANT_NEGOTIATES, message)
        this.name = 'VariantNegotiatesError'
    }
}

export class InsufficientStorageError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.INSUFFICIENT_STORAGE, message)
        this.name = 'InsufficientStorageError'
    }
}

export class LoopDetectedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.LOOP_DETECTED, message)
        this.name = 'LoopDetectedError'
    }
}

export class NotExtendedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NOT_EXTENDED, message)
        this.name = 'NotExtendedError'
    }
}

export class NetworkAuthFailedError extends HTTPError {
    constructor(message: string) {
        super(HTTPStatus.NETWORK_AUTH_FAILED, message)
        this.name = 'NetworkAuthFailedError'
    }
}

export type ErrorHandler = (
    context: Context,
    error: HTTPError,
) => Promise<HTTPResponse> | HTTPResponse

export const defaultErrorHandler: ErrorHandler = (_ctx: Context, error: HTTPError) => {
    return new HTTPResponse({
        status: error.code,
        type: ContentType.HTML,
        body: HTMLErrorTemplate(error),
    })
}

export const error400 = new HTTPResponse({
    status: HTTPStatus.BAD_REQUEST,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new BadRequestError(
            'Bad request',
        ),
    ),
})

export const error403 = new HTTPResponse({
    status: HTTPStatus.FORBIDDEN,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new ForbiddenError(
            'Forbidden',
        ),
    ),
})

export const error404 = new HTTPResponse({
    status: HTTPStatus.NOT_FOUND,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new NotFoundError(
            'The page was not found',
        ),
    ),
})

export const error500 = new HTTPResponse({
    status: HTTPStatus.INTERNAL_ERROR,
    type: 'text/html; charset=UTF-8',
    body: HTMLErrorTemplate(
        new InternalError(
            'Internal server error',
        ),
    ),
})
