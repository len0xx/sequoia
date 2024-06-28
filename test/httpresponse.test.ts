// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../httpresponse.ts

import { CookieStorage } from '../cookie.ts'
import { assertEquals, assertInstanceOf } from '../deps.ts'
import { HTTPResponse, HTTPResponseOptions, isStatusNullBody } from '../httpresponse.ts'
import { ContentType } from '../media.ts'
import { HTTPStatus } from '../status.ts'

Deno.test('isStatusNullBody()', () => {
    assertEquals(isStatusNullBody(HTTPStatus.SWITCHING_PROTOCOLS), true)
    assertEquals(isStatusNullBody(HTTPStatus.NO_CONTENT), true)
    assertEquals(isStatusNullBody(HTTPStatus.RESET_CONTENT), true)
    assertEquals(isStatusNullBody(HTTPStatus.NOT_MODIFIED), true)
    assertEquals(isStatusNullBody(HTTPStatus.SUCCESS), false)
    assertEquals(isStatusNullBody(HTTPStatus.SERVICE_UNAVAILABLE), false)
    assertEquals(isStatusNullBody(HTTPStatus.PROXY_AUTH_REQUIRED), false)
    assertEquals(isStatusNullBody(HTTPStatus.INTERNAL_ERROR), false)
})

Deno.test('HTTPResponse class', async (t) => {
    await t.step('constructor string', () => {
        const initializer = 'Hello world'
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer)
        assertEquals(res.status, HTTPStatus.SUCCESS)
        assertEquals(res.type, undefined)
        assertInstanceOf(res.headers, Headers)
    })

    await t.step('constructor number', () => {
        const initializer = 400
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer)
    })

    await t.step('constructor BigInt', () => {
        const initializer = BigInt(5000000000)
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer)
    })

    await t.step('constructor boolean', () => {
        const initializer = true
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer)
    })

    await t.step('constructor symbol', () => {
        const initializer = Symbol('h')
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer)
    })

    await t.step('constructor function', () => {
        const initializer = () => 'Im a string'
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer())
    })

    await t.step('constructor HTTPResponseOptions', () => {
        const initialHeaders = new Headers()
        initialHeaders.set('X-Server', 'Sequoia')

        const initializer: HTTPResponseOptions = {
            body: { ok: true },
            status: HTTPStatus.CREATED,
            headers: initialHeaders,
        }
        const res = new HTTPResponse(initializer)
        assertEquals(res.body, initializer.body)
        assertEquals(res.status, initializer.status)
        assertEquals(res.type, ContentType.JSON)
        assertInstanceOf(res.headers, Headers)
        assertEquals(res.headers.get('X-Server'), initialHeaders.get('X-Server'))
    })

    await t.step('empty() method', () => {
        const res = new HTTPResponse('')
        assertEquals(res.empty(), true)

        const res2 = new HTTPResponse('Hello world')
        assertEquals(res2.empty(), false)

        const res3 = new HTTPResponse('')
        res3.headers.set('X-Test', '1')
        assertEquals(res3.empty(), false)

        const res4 = new HTTPResponse('Hello world')
        res4.headers.set('X-Test', '1')
        assertEquals(res4.empty(), false)
    })

    await t.step('applyCookies() method: 1 cookie', () => {
        const res = new HTTPResponse('')
        const cookiesRecord = {
            token: 'NjvchS7chs',
        }
        const cookies = new CookieStorage(cookiesRecord, { overwrite: true })
        res.applyCookies(cookies)
        assertEquals(res.headers.get('Set-Cookie'), 'token=NjvchS7chs')
    })

    await t.step('applyCookies() method: 2 cookies', () => {
        const res = new HTTPResponse('')
        const cookiesRecord = {
            token: 'NjvchS7chs',
            second: '24059',
        }
        const cookies = new CookieStorage(cookiesRecord, { overwrite: true })
        res.applyCookies(cookies)
        assertEquals(res.headers.get('Set-Cookie'), 'token=NjvchS7chs, second=24059')
    })

    await t.step('applyCookies() method: 2 cookies with options', () => {
        const res = new HTTPResponse('')
        const cookiesRecord = {
            token: 'NjvchS7chs',
            second: '24059',
        }
        const cookies = new CookieStorage(cookiesRecord, {
            overwrite: true,
            httpOnly: true,
            path: '/',
        })
        res.applyCookies(cookies)
        assertEquals(
            res.headers.get('Set-Cookie'),
            'token=NjvchS7chs; HttpOnly; Path=/, second=24059; HttpOnly; Path=/',
        )
    })

    await t.step('transform() method', async () => {
        const initializer: HTTPResponseOptions = {
            body: 'Hello world',
            status: HTTPStatus.ACCEPTED,
            type: ContentType.HTML,
        }
        const res = new HTTPResponse(initializer)
        const response = res.transform()
        assertInstanceOf(response, Response)
        assertEquals(await response.text(), res.body)
        assertEquals(response.ok, true)
        assertEquals(response.status, res.status)
        assertEquals(response.headers.get('content-type'), ContentType.HTML)
    })
})
