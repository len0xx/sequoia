// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../app.ts

import { Application } from '../app.ts'
import { HTTPResponse } from '../httpresponse.ts'
import { HTTPStatus } from '../status.ts'
import { Router } from '../router.ts'
import { assertEquals, assertRejects } from '../deps.ts'
import { ContentType } from '../media.ts'
import { Context } from '../context.ts'
import { HTTPError, NotAllowedError } from '../error.ts'

const BASE_URL = 'http://localhost'

Deno.test({
    name: 'Application instance works as expected',
    permissions: { net: true },
    sanitizeResources: true,
    sanitizeOps: true,
    sanitizeExit: true,
}, async () => {
    const app = new Application()
    const router = new Router()
    const ac = new AbortController()
    const port = 4000
    const responseText = 'Hello world'

    router.GET('/', () => new HTTPResponse(responseText))
    app.useRouter(router)
    app.listen({ signal: ac.signal, port })

    const res = await fetch(`${BASE_URL}:${port}/`)
    assertEquals(res.status, 200)
    assertEquals(await res.text(), responseText)
    ac.abort()
    await app.shutdown()
})

Deno.test({
    name: 'Set default content type to JSON',
    permissions: { net: true },
    sanitizeResources: true,
    sanitizeOps: true,
    sanitizeExit: true,
}, async () => {
    const app = new Application()
    const router = new Router({ type: ContentType.JSON })
    const ac = new AbortController()
    const port = 4001

    router.GET('/', () => new HTTPResponse({ body: { ok: true } }))
    app.useRouter(router)
    app.listen({ signal: ac.signal, port })

    const res = await fetch(`${BASE_URL}:${port}/`)
    assertEquals(res.status, 200)
    assertEquals(res.headers.get('content-type'), ContentType.JSON)
    assertEquals(await res.json(), { ok: true })
    ac.abort()
    await app.shutdown()
})

Deno.test({
    name: 'Error handlers',
    permissions: { net: true },
    sanitizeResources: true,
    sanitizeOps: true,
    sanitizeExit: true,
}, async () => {
    const app = new Application()
    const router = new Router()
    const ac = new AbortController()
    const port = 4002
    const errBody = { ok: false }

    app.handleErrors((_ctx: Context, error: HTTPError) => {
        return new HTTPResponse({
            body: errBody,
            type: ContentType.JSON,
            status: error.code,
        })
    })

    router.GET('/', () => new HTTPResponse({ body: { ok: true } }))
    router.POST('/error', () => {
        throw new NotAllowedError('POST method is not allowed')
    })

    app.useRouter(router)
    app.listen({ signal: ac.signal, port })

    // Global error handling for 404
    const res1 = await fetch(`${BASE_URL}:${port}/404`)
    assertEquals(res1.status, 404)
    assertEquals(await res1.json(), errBody)

    // Error thrown inside of a middleware
    const res2 = await fetch(`${BASE_URL}:${port}/error`, { method: 'POST' })
    assertEquals(res2.status, HTTPStatus.NOT_ALLOWED)
    assertEquals(await res2.json(), errBody)

    ac.abort()
    await app.shutdown()
})

Deno.test({
    name: 'Server is not respoding after shutdown',
    permissions: { net: true },
    sanitizeResources: true,
    sanitizeOps: true,
    sanitizeExit: true,
}, async () => {
    const app = new Application()
    const router = new Router()
    const ac = new AbortController()
    const port = 4003
    const body = { ok: true }

    router.GET('/', () => new HTTPResponse({ body }))
    app.useRouter(router)
    app.listen({ signal: ac.signal, port })

    const res = await fetch(`${BASE_URL}:${port}/`)
    assertEquals(res.status, 200)
    assertEquals(await res.json(), body)
    ac.abort()
    await app.shutdown()

    assertRejects(
        async () => await fetch(`${BASE_URL}:${port}/`),
        TypeError,
        `error sending request for url (${BASE_URL}:${port}/): connection closed before message completed`,
    )
})
