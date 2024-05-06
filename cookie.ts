// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

export interface CookieOptions {
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

export function recordToStorage(
    src: Record<string, string>,
    options: CookieOptions = {},
) {
    return Object.entries(src).map((entry) => [
        entry[0],
        new Cookie(entry[0], entry[1], options),
    ]) as [string, Cookie][]
}

export function parseCookies(input: string): Record<string, string> {
    return input.length
        ? Object.fromEntries(
            input.split('; ').map((v) => v.split(/=(.*)/s).map(decodeURIComponent)),
        )
        : {}
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

    constructor(name: string, value: string | null, options?: CookieOptions) {
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

    toString(): string {
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

export class CookieStorage {
    readonly #storage: Map<string, Cookie>

    constructor(
        src?: Record<string, string> | undefined,
        options?: CookieOptions,
    ) {
        this.#storage = src
            ? new Map<string, Cookie>(
                recordToStorage(src, options ?? { overwrite: false }),
            )
            : new Map()
    }

    set = (name: string, value: string | null, options?: CookieOptions): void => {
        this.#storage.set(name, new Cookie(name, value, options))
    }

    delete = (name: string): void => {
        const cookie = this.#storage.get(name)

        if (cookie) {
            this.#storage.set(name, new Cookie(name, null, { path: cookie.path }))
        }
    }

    get = (name: string): Cookie | null => {
        return this.#storage.get(name) || null
    }

    entries = (): [string, Cookie][] => Array.from(this.#storage.entries())

    size = (): number => this.#storage.size
}
