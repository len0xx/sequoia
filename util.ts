// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { HTTPError } from './error.ts'
import { HTTPHandler } from './middleware.ts'
import { HTTPResponse } from './httpresponse.ts'
import { HTTPStatus, isError } from './status.ts'
import { isWindows, match, mediaTypes, type Path, Status, stdPath } from './deps.ts'
import type { RoutePath } from './router.ts'

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export type IterableRecord<T> =
    & Record<string, T>
    & Iterable<readonly [string, T]>

export function defineContentType(filename: string): string | undefined {
    const ext = stdPath.extname(filename)
    return mediaTypes.contentType(ext)
}

export const WINDOWS_DELIMETER_SYMBOL = '\\'
export const UNIX_DELIMETER_SYMBOL = '/'
export const DELIMETER_SYMBOL = isWindows ? WINDOWS_DELIMETER_SYMBOL : UNIX_DELIMETER_SYMBOL

export function normalizePath(path: RoutePath, osSpecific = false): RoutePath {
    if (!(path instanceof RegExp) && path !== '*') {
        const delimeter = osSpecific ? DELIMETER_SYMBOL : UNIX_DELIMETER_SYMBOL
        path = stdPath.normalize(path)
        path = path.endsWith(delimeter) ? path.slice(0, path.length - 1) : path
        return !path.startsWith(delimeter) ? delimeter + path : path
    }
    return path
}

export function convertToBody<T>(input: T): BodyInit {
    if (
        input instanceof Blob ||
        input instanceof FormData ||
        input instanceof URLSearchParams ||
        input instanceof ReadableStream ||
        typeof input === 'string'
    ) {
        return input as BodyInit
    } else {
        return input ? typeof input === 'object' ? JSON.stringify(input) : input.toString() : ''
    }
}

export function isRegExp(path: RoutePath): boolean {
    return path instanceof RegExp
}

export function splitPath(path: string): string[] {
    return path.split('/').filter(Boolean)
}

export function HTMLTemplate(title: string, content: string): string {
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

export function HTMLErrorTemplate(error: HTTPError): string {
    return HTMLTemplate(
        `Error ${error.code}: ${error.message}`,
        `<div style="text-align: center;">
        <h3>Error ${error.code}: ${error.message}</h3><hr />
        <p>Powered by Sequoia</p>
    </div>`,
    )
}

export function parseCookies(input: string): Record<string, string> {
    const inputArr = input
        .split(';')
        .filter(Boolean)
        .map((entry) => entry.trim())
    const result: Record<string, string> = {}
    for (const val of inputArr) {
        const cur = val.split('=')
        result[cur[0]] = cur[1]
    }
    return result
}

export function getIterableRecord<T>(
    src: Record<string, T>,
): IterableRecord<T> {
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

export function getRemoteAddress(info: Deno.ServeHandlerInfo): Deno.NetAddr {
    return info.remoteAddr
}

export function redirect(
    url: URL | string,
    status: HTTPStatus | Status = HTTPStatus.TEMP_REDIRECT,
    headers?: Headers | undefined,
): HTTPResponse {
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

export function createMatcher(route: Path): Matcher {
    return match(route, { decode: decodeURIComponent })
}

export function combineHeaders(...headers: Headers[]): Headers {
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

export function outputHandlers(
    handler: HTTPHandler,
): Pick<HTTPHandler, 'root' | 'path' | 'static'> & { methods: string } {
    return {
        root: handler.root,
        path: handler.path,
        methods: handler.methods.length === 0 ? 'ANY' : handler.methods.join(', '),
        static: handler.static,
    }
}

export function extractParams(
    handler: HTTPHandler,
    path: string,
): Record<string, string> {
    const match = handler.path !== '*' ? createMatcher(handler.path) : (_: string) => false
    return !(isRegExp(handler.path) || handler.static) ? (match(path) as MatchSuccess).params : {}
}

export function responseLog(response: HTTPResponse): string {
    return `Response: ${response.status} ${!isError(response.status) ? 'OK' : 'ERROR'}`
}
