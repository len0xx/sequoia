// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { Status } from './deps.ts'
import { HTTPStatus } from './status.ts'
import { CookieStorage } from './cookie.ts'
import { convertToBody, type Writeable } from './util.ts'

export type ResponseBody = string | number | bigint | boolean | symbol | object | null | undefined
export type ResponseBodyFunction = () => ResponseBody | Promise<ResponseBody>

export interface HTTPResponseOptions {
    body: ResponseBody | ResponseBodyFunction
    headers?: Headers
    type?: string
    status?: HTTPStatus | Status
}

export type HTTPResponseInit =
    | string
    | number
    | bigint
    | boolean
    | symbol
    | ResponseBodyFunction
    | HTTPResponseOptions

export function isStatusNullBody(status: HTTPStatus | Status): boolean {
    return (
        status === HTTPStatus.SWITCHING_PROTOCOLS ||
        status === HTTPStatus.NO_CONTENT ||
        status === HTTPStatus.RESET_CONTENT ||
        status === HTTPStatus.NOT_MODIFIED
    )
}

export class HTTPResponse {
    readonly body: ResponseBody = null
    readonly headers = new Headers()
    readonly status: HTTPStatus | Status = HTTPStatus.SUCCESS
    readonly type?: string

    constructor(initializer: HTTPResponseInit) {
        if (['string', 'number', 'bigint', 'boolean', 'symbol'].includes(typeof initializer)) {
            this.body = initializer
        } else if (typeof initializer === 'function') {
            this.body = initializer()
        } else {
            const options = initializer as HTTPResponseOptions

            this.body = typeof options.body === 'function'
                ? (options.body as ResponseBodyFunction)()
                : options.body
            this.type = options.type
            this.status = options.status ?? HTTPStatus.SUCCESS
            if (options.headers) this.headers = options.headers
        }
    }

    transform = (): Response => {
        const body: BodyInit | null = isStatusNullBody(this.status)
            ? null
            : convertToBody(this.body)
        const headers = new Headers()
        const status = this.status

        if (this.headers) {
            for (const [key, val] of this.headers.entries()) {
                if (typeof val === 'string' && val) {
                    headers.append(key, val)
                }
            }
        }

        if (this.type) headers.set('Content-Type', this.type)

        return new Response(body, { status, headers })
    }

    empty = (): boolean => {
        let headers = 0
        for (const _ of this.headers.keys()) headers++
        return (headers === 0 && !this.body)
    }

    applyCookies = (storage: CookieStorage): void => {
        if (storage.size()) {
            const cookies = storage.entries().filter((entry) => entry[1].overwrite)
            for (const cookie of cookies) {
                this.headers.append('Set-Cookie', cookie[1].toString())
            }
        }
    }
}

export type HTTPContextResponse = Writeable<HTTPResponse>
