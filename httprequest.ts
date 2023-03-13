// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

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

    clone: () => Request
    arrayBuffer: () => Promise<ArrayBuffer>
    blob: () => Promise<Blob>
    formData: () => Promise<FormData>
    // deno-lint-ignore no-explicit-any
    json: () => Promise<any>
    text: () => Promise<string>

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

        this.clone = request.clone
        this.arrayBuffer = request.arrayBuffer
        this.blob = request.blob
        this.formData = request.formData
        this.json = request.json
        this.text = request.text
    }
}
