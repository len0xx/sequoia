// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

export interface CORSOptions {
    readonly origin?: string
    readonly methods?: string[]
    readonly headers?: string[]
    readonly exposeHeaders?: string[]
    readonly credentials?: boolean
    readonly maxAge?: number
}

export class CORS {
    private internalHeaders: Headers

    constructor(options: CORSOptions) {
        this.internalHeaders = new Headers()
        if (options.origin && options.origin.length) {
            this.internalHeaders.set('Access-Control-Allow-Origin', options.origin)
        }
        if (options.methods && options.methods.length) {
            this.internalHeaders.set('Access-Control-Allow-Methods', options.methods.join(', '))
        }
        if (typeof options.credentials === 'boolean') {
            this.internalHeaders.set(
                'Access-Control-Allow-Credentials',
                options.credentials.toString(),
            )
        }
        if (options.exposeHeaders && options.exposeHeaders.length) {
            this.internalHeaders.set(
                'Access-Control-Expose-Headers',
                options.exposeHeaders.join(', '),
            )
        }
        if (typeof options.maxAge === 'number') {
            this.internalHeaders.set(
                'Access-Control-Allow-Max-Age',
                Math.floor(options.maxAge).toString(),
            )
        }
        if (options.headers && options.headers.length) {
            this.internalHeaders.set('Access-Control-Allow-Headers', options.headers.join(', '))
        }
    }

    getHeaders() {
        return this.internalHeaders
    }
}
