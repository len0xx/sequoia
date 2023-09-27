// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { stdPath } from './deps.ts'
import { HTTPError, InternalError, NotFoundError } from './error.ts'
import { HTTPResponse } from './httpresponse.ts'
import { ContentType } from './media.ts'
import { HTTPStatus } from './status.ts'
import { defineContentType, normalizePath } from './util.ts'

export const INDEX_FILENAME = 'index.html'

export async function fileExists(src: string): Promise<boolean> {
    try {
        return (await Deno.stat(src)).isFile
    } catch {
        return false
    }
}

export async function serveFile(src: string): Promise<HTTPResponse> {
    try {
        const fileInfo = await Deno.stat(src)
        if (fileInfo.isDirectory) {
            throw new HTTPError(HTTPStatus.FORBIDDEN, 'The requested file is a directory')
        }
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            throw new NotFoundError('The file is not found')
        } else throw error
    }

    const file = await Deno.open(src, { read: true })
    const contentType = defineContentType(stdPath.basename(src))
    const response = new HTTPResponse({
        status: HTTPStatus.SUCCESS,
        type: contentType || ContentType.PLAIN,
        body: file.readable,
    })

    return response
}

export async function serveStatic(url: URL, path: string, dir: string): Promise<HTTPResponse> {
    const filename = url.pathname.endsWith('/') ? '/' : stdPath.basename(url.pathname)
    const relativePath = url.pathname.replace(normalizePath(path), '')

    if (filename) {
        const filepath = stdPath.posix.join(stdPath.normalize(dir), relativePath)
        let response: HTTPResponse | undefined = undefined
        try {
            if (await fileExists(filepath)) {
                response = await serveFile(filepath)
            } else if (await fileExists(stdPath.posix.join(filepath, `/${INDEX_FILENAME}`))) {
                response = await serveFile(stdPath.posix.join(filepath, `/${INDEX_FILENAME}`))
            }

            if (!response) {
                throw new HTTPError(HTTPStatus.NOT_FOUND, 'The page was not found')
            }
            return response
        } catch (error) {
            if (error instanceof HTTPError) {
                throw error
            }
            throw new InternalError(
                error instanceof Error ? error.message : 'Internal server error',
            )
        }
    }
    throw new HTTPError(HTTPStatus.NOT_FOUND, 'The page was not found')
}
