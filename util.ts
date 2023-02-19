// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { HTTPError } from './error.ts'
import { HTTPHandler } from './middleware.ts'
import { HTTPResponse } from './httpresponse.ts'
import { HTTPStatus, isError } from './status.ts'
import { match, mediaTypes, type Path, Status, stdPath } from './deps.ts'
import type { RoutePath } from './router.ts'

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export type IterableRecord<T> = Record<string, T> & Iterable<readonly [string, T]>

export const defineContentType = (filename: string): string | undefined => {
    const ext = stdPath.extname(filename)
    return mediaTypes.contentType(ext)
}

export const normalizePath = (path: RoutePath): RoutePath => {
    if (!(path instanceof RegExp) && path !== '*') {
        path = stdPath.normalize(path)
        path = path.endsWith('/') ? path.slice(0, path.length - 1) : path
        return !path.startsWith('/') ? '/' + path : path
    }
    return path
}

export const convertToBody = <T>(input: T): BodyInit => {
    if (
        input instanceof Blob || input instanceof FormData || input instanceof URLSearchParams ||
        input instanceof ReadableStream<Uint8Array> || typeof input === 'string'
    ) {
        return input as BodyInit
    } else {
        return input ? (typeof input === 'object' ? JSON.stringify(input) : input.toString()) : ''
    }
}

export const isRegExp = (path: RoutePath): boolean => path instanceof RegExp

export const splitPath = (path: string): string[] => path.split('/').filter((part) => part)

export const HTMLTemplate = (title: string, content: string): string => {
    return `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
            <title>${title}</title>
        </head>
        <body>
            ${content}
        </body>
    </html>`
}

export const HTMLErrorTemplate = (error: HTTPError): string => {
    return HTMLTemplate(
        `Error ${error.code}: ${error.message}`,
        `<div style="text-align: center;">
        <h3>Error ${error.code}: ${error.message}</h3><hr />
        <p>Powered by Sequoia</p>
    </div>`,
    )
}

export const parseCookies = (input: string): Record<string, string> => {
    const inputArr = input.split(';').map((entry) => entry.trim())
    const result: Record<string, string> = {}
    for (const val of inputArr) {
        const cur = val.split('=')
        result[cur[0]] = cur[1]
    }
    return result
}

export const getIterableRecord = <T>(src: Record<string, T>): IterableRecord<T> => {
    return {
        ...src,
        [Symbol.iterator]() {
            let index = 0
            let done = false
            const properties = Object.keys(this)
            return {
                next: () => {
                    done = index >= properties.length

                    const obj = {
                        done: done,
                        value: this[properties[index]],
                        key: properties[index],
                    }
                    index++
                    return obj
                },
            }
        },
    } as IterableRecord<T>
}

export function assertIsNetAddr(addr: Deno.Addr): asserts addr is Deno.NetAddr {
    if (!['tcp', 'udp'].includes(addr.transport)) {
        throw new TypeError('Not a network address')
    }
}

export const getRemoteAddress = (connection: Deno.Conn): Deno.NetAddr => {
    assertIsNetAddr(connection.remoteAddr)
    return connection.remoteAddr
}

export const redirect = (
    url: URL | string,
    status: HTTPStatus | Status = HTTPStatus.TEMP_REDIRECT,
    headers?: Headers | undefined,
): HTTPResponse => {
    const finalHeaders = headers || new Headers()
    finalHeaders.set('Location', url.toString())

    return new HTTPResponse({
        body: null,
        status: status,
        headers: finalHeaders,
    })
}

export interface MatchSuccess {
    path: string
    index: number
    params: Record<string, string>
}

export type MatchResult = MatchSuccess | false

export type Matcher = (route: string) => MatchResult

export const createMatcher = (route: Path): Matcher => match(route, { decode: decodeURIComponent })

export const combineHeaders = (...headers: Headers[]): Headers => {
    const result = new Headers()
    for (const setOfHeaders of headers) {
        if (setOfHeaders && setOfHeaders instanceof Headers) {
            for (const [key, value] of Array.from(setOfHeaders.entries())) {
                result.append(key, value)
            }
        }
    }
    return result
}

export const outputHandlers = (
    handler: HTTPHandler,
): { path: RoutePath; methods: string; static: boolean } => ({
    path: handler.path,
    methods: handler.methods.length === 0 ? 'ANY' : handler.methods.join(', '),
    static: handler.static,
})

export const extractParams = (handler: HTTPHandler, path: string): Record<string, string> => {
    const match = handler.path !== '*' ? createMatcher(handler.path) : (_: string) => false
    return (
            !(isRegExp(handler.path) ||
                handler.static)
        )
        ? (match(path) as MatchSuccess).params
        : {}
}

export const responseLog = (response: HTTPResponse): string => {
    return `Response: ${response.status} ${!isError(response.status) ? 'OK' : 'ERROR'}`
}
