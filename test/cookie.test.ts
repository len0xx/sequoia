// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../cookie.ts

import { Cookie, CookieOptions, CookieStorage, parseCookies, recordToStorage } from '../cookie.ts'
import { assertEquals } from '../deps.ts'

Deno.test('recordToStorage()', async (t) => {
    await t.step('simple record', () => {
        const record: Record<string, string> = {
            foo: 'bar',
            bar: 'baz',
        }
        const storage = recordToStorage(record)
        assertEquals(record.foo, storage[0][1].value)
        assertEquals(record.bar, storage[1][1].value)
    })
})

Deno.test('Cookie class', async (t) => {
    const date = new Date('2024-06-17T13:24:00')
    const options: CookieOptions = {
        httpOnly: true,
        path: '/',
        domain: 'localhost.com',
        expires: date,
        maxAge: 12345,
        secure: true,
        sameSite: 'lax',
        signed: true,
    }

    await t.step('default constructor', () => {
        const cookie = new Cookie('test', 'val')
        assertEquals(cookie.name, 'test')
        assertEquals(cookie.value, 'val')
    })

    await t.step('constructor with options', () => {
        const cookie = new Cookie('foo', 'bar', options)
        assertEquals(cookie.name, 'foo')
        assertEquals(cookie.value, 'bar')
        assertEquals(cookie.httpOnly, options.httpOnly)
        assertEquals(cookie.path, options.path)
        assertEquals(cookie.domain, options.domain)
        assertEquals(cookie.expires, options.expires)
        assertEquals(cookie.maxAge, options.maxAge)
        assertEquals(cookie.secure, options.secure)
        assertEquals(cookie.sameSite, options.sameSite)
        assertEquals(cookie.signed, options.signed)
    })

    await t.step('constructor with URI-encoded value', () => {
        const cookie = new Cookie('foo', '$(test-value:;&)', options)
        assertEquals(cookie.name, 'foo')
        assertEquals(cookie.value, encodeURIComponent('$(test-value:;&)'))
    })

    await t.step('toString()', () => {
        const cookie = new Cookie('foo', 'bar', options)
        assertEquals(
            cookie.toString(),
            `foo=bar; Expires=${date.toUTCString()}; HttpOnly; Secure; Domain=localhost.com; Path=/; SameSite=lax; Max-Age=12345`,
        )
    })
})

Deno.test('Storage class', async (t) => {
    await t.step('constructor', () => {
        const record: Record<string, string> = {
            foo: 'bar',
        }
        const storage = new CookieStorage(record)
        assertEquals(record.foo, storage.get('foo')!.value)
    })

    await t.step('get() on nonexistent entry', () => {
        const record: Record<string, string> = {
            foo: 'bar',
        }
        const storage = new CookieStorage(record)
        assertEquals(storage.get('bar'), null)
    })

    await t.step('set() and size() methods', () => {
        const record: Record<string, string> = {
            foo: 'bar',
        }
        const storage = new CookieStorage(record)
        assertEquals(storage.size(), 1)
        storage.set('bar', 'baz')
        assertEquals(record.foo, storage.get('foo')!.value)
        assertEquals('baz', storage.get('bar')!.value)
        assertEquals(storage.size(), 2)
    })

    await t.step('delete() method', () => {
        const record: Record<string, string> = {
            foo: 'bar',
            bar: 'baz',
        }
        const storage = new CookieStorage(record)
        storage.set('bar', record.bar)
        assertEquals(record.foo, storage.get('foo')!.value)
        assertEquals(record.bar, storage.get('bar')!.value)
        storage.delete('foo')
        assertEquals(null, storage.get('foo')!.value)
    })
})

Deno.test('parseCookies()', async (t) => {
    await t.step('empty', () => {
        const source = ''
        const result = parseCookies(source)
        assertEquals(result, {})
    })

    await t.step('not empty', () => {
        const source = 'token=NVusVh37Vhs759VjDS8vjoiDB9rn7d1; example=SbhSDydj2'
        const result = parseCookies(source)
        const cookies = {
            token: 'NVusVh37Vhs759VjDS8vjoiDB9rn7d1',
            example: 'SbhSDydj2',
        }
        assertEquals(result, cookies)
    })

    await t.step('URI-encoded cookie', () => {
        const firstString = 'Hello World;'
        const firstValue = encodeURIComponent(firstString)
        const secondString = '$(test-value:?)'
        const secondValue = encodeURIComponent(secondString)
        const source = `first=${firstValue}; second=${secondValue}`
        const result = parseCookies(source)

        const cookies = {
            first: firstString,
            second: secondString,
        }
        assertEquals(result, cookies)
    })
})
