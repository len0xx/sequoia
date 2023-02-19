// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import type { RouteParams } from './router.ts'

export class HTTPContextRequest<
    Params extends Record<string, string> = RouteParams,
> {
    readonly cache: RequestCache
    readonly credentials: RequestCredentials
    readonly destination: RequestDestination
    readonly headers: Headers
    readonly integrity: string
    readonly isHistoryNavigation: boolean
    readonly isReloadNavigation: boolean
    readonly keepalive: boolean
    readonly method: string
    readonly mode: RequestMode
    readonly redirect: RequestRedirect
    readonly referrer: string
    readonly referrerPolicy: ReferrerPolicy
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
        this.cache = request.cache
        this.credentials = request.credentials
        this.destination = request.destination
        this.headers = request.headers
        this.integrity = request.integrity
        this.isHistoryNavigation = request.isHistoryNavigation
        this.isReloadNavigation = request.isReloadNavigation
        this.keepalive = request.keepalive
        this.mode = request.mode
        this.redirect = request.redirect
        this.referrer = request.referrer
        this.referrerPolicy = request.referrerPolicy
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
