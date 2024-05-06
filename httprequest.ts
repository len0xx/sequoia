// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import type { RouteParams } from './router.ts'

export class HTTPContextRequest<
    Params extends Record<string, string> = RouteParams,
> {
    readonly headers: Headers
    readonly method: string
    readonly redirect: RequestRedirect
    readonly signal: AbortSignal
    readonly url: URL
    readonly body: ReadableStream<Uint8Array> | null
    readonly bodyUsed: boolean
    readonly originalRequest: Request
    params: Params

    constructor(request: Request, params: Params = {} as Params) {
        this.body = request.body
        this.bodyUsed = request.bodyUsed
        this.headers = request.headers
        this.redirect = request.redirect
        this.signal = request.signal
        this.url = new URL(request.url)
        this.method = request.method
        this.originalRequest = request
        this.params = params
    }

    // deno-lint-ignore no-explicit-any
    async json(): Promise<any> {
        return await this.originalRequest.json()
    }

    async text(): Promise<string> {
        return await this.originalRequest.text()
    }

    async formData(): Promise<FormData> {
        return await this.originalRequest.formData()
    }

    async blob(): Promise<Blob> {
        return await this.originalRequest.blob()
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        return await this.originalRequest.arrayBuffer()
    }
}
