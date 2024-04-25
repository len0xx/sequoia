// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { Status } from './deps.ts'

export enum HTTPStatus {
    // Information responses
    CONTINUE = 100,
    SWITCHING_PROTOCOLS = 101,
    PROCESSING = 102,
    EARLY_HINTS = 103,

    // Successful responses
    SUCCESS = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NON_AUTHORITATIVE_INFO = 203,
    NO_CONTENT = 204,
    RESET_CONTENT = 205,
    PARTIAL_CONTENT = 206,
    MULTI_STATUS = 207,
    ALREADY_REPORTED = 208,
    IM_USED = 226,

    // Redirection responses
    MULTIPLE_CHOICES = 300,
    MOVED = 301,
    FOUND = 302,
    SEE_OTHER = 303,
    NOT_MODIFIED = 304,
    USE_PROXY = 305,
    TEMP_REDIRECT = 307,
    PERM_REDIRECT = 308,

    // Client error responses
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    PAYMENT_REQUIRED = 402,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    NOT_ALLOWED = 405,
    NOT_ACCEPTABLE = 406,
    PROXY_AUTH_REQUIRED = 407,
    TIMEOUT = 408,
    CONFLICT = 409,
    GONE = 410,
    LENGTH_REQUIRED = 411,
    PRECONDITION_FAILED = 412,
    PAYLOAD_TOO_LARGE = 413,
    URI_TOO_LONG = 414,
    UNSUPPORTED_MEDIA = 415,
    RANGE_NOT_SATISFIED = 416,
    EXPECTATION_FAILED = 417,
    IM_A_TEAPOT = 418,
    MISDIRECTED_REQUEST = 421,
    UNSUPPORTED_ENTITY = 422,
    LOCKED = 423,
    FAILED_DEPENDENCY = 424,
    TOO_EARLY = 425,
    UPGRADE_REQUIRED = 426,
    PRECONDITION_REQUIRED = 428,
    TOO_MANY_REQUESTS = 429,
    HEADERS_FIELDS_TOO_LARGE = 431,
    UNAVAILABLE = 451,

    // Server error responses
    INTERNAL_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504,
    HTTP_VERSION_NOT_SUPPORTED = 505,
    VARIANT_NEGOTIATES = 506,
    INSUFFICIENT_STORAGE = 507,
    LOOP_DETECTED = 508,
    NOT_EXTENDED = 510,
    NETWORK_AUTH_FAILED = 511,
}

export function isSuccessful(status: HTTPStatus | Status): boolean {
    return status >= 100 && status < 300
}

export function isRedirect(status: HTTPStatus | Status): boolean {
    return status >= 300 && status < 400
}

export function isClientError(status: HTTPStatus | Status): boolean {
    return status >= 400 && status < 500
}

export function isServerError(status: HTTPStatus | Status): boolean {
    return status >= 500 && status < 600
}

export function isError(status: HTTPStatus | Status): boolean {
    return isClientError(status) || isServerError(status)
}
