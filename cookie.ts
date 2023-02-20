// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

export interface CookiesOptions {
    domain?: string
    path?: string
    expires?: Date
    httpOnly?: boolean
    maxAge?: number
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none' | boolean
    signed?: boolean
    overwrite?: boolean
}

export function recordToStorage(src: Record<string, string>, options: CookiesOptions = {}) {
    return Object.entries(src).map(
        (entry) => [entry[0], new Cookie(entry[0], entry[1], options)],
    ) as [
        string,
        Cookie,
    ][]
}

export class CookieStorage {
    readonly #storage: Map<string, Cookie>

    constructor(src?: Record<string, string> | undefined, options?: CookiesOptions) {
        this.#storage = src
            ? new Map<string, Cookie>(recordToStorage(src, options ?? { overwrite: false }))
            : new Map()
    }

    set = (name: string, value: string | null, options?: CookiesOptions) => {
        this.#storage.set(name, new Cookie(name, value, options))
    }

    delete = (name: string) => {
        const cookie = this.#storage.get(name)

        if (cookie) {
            this.#storage.set(
                name,
                new Cookie(name, null, { path: cookie.path }),
            )
        }
    }

    get = (name: string) => {
        return this.#storage.get(name) || null
    }

    entries = () => Array.from(this.#storage.entries())

    size = () => this.#storage.size
}

export class Cookie {
    readonly name: string
    value: string | null
    overwrite: boolean
    path?: string
    httpOnly?: boolean
    domain?: string
    expires?: Date
    maxAge?: number
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none' | boolean
    signed?: boolean

    constructor(name: string, value: string | null, options?: CookiesOptions) {
        this.name = name
        this.value = value || null
        this.httpOnly = options?.httpOnly
        this.path = options?.path
        this.domain = options?.domain
        this.expires = value ? options?.expires : new Date(1970, 0, 1)
        this.maxAge = options?.maxAge
        this.secure = options?.secure
        this.sameSite = options?.sameSite
        this.signed = options?.signed
        this.overwrite = options && typeof options.overwrite === 'boolean'
            ? options.overwrite
            : true
    }

    toString() {
        if (this.value) {
            return `${this.name}=${this.value}${
                this.expires ? `; Expires=${this.expires.toUTCString()}` : ''
            }${this.httpOnly ? `; HttpOnly` : ''}${this.secure ? `; Secure` : ''}${
                this.domain ? `; Domain=${this.domain}` : ''
            }${this.path ? `; Path=${this.path}` : ''}${
                this.sameSite
                    ? `; SameSite=${this.sameSite}${this.maxAge ? `; Max-Age=${this.maxAge}` : ''}`
                    : ''
            }`
        } else {
            return `${this.name}=; Expires=${new Date(1970, 0, 1)}; Path=${this.path || '/'}`
        }
    }
}
