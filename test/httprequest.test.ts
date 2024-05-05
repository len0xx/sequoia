// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../httprequest.ts

import { assertEquals } from '../deps.ts'
import { ContentType } from '../media.ts'
import { HTTPContextRequest } from '../httprequest.ts'

Deno.test('HTTPRequest class', async (t) => {
    await t.step('default constructor', async () => {
        const reqHeaders = new Headers()
        reqHeaders.set('Content-Type', ContentType.JSON)
        const options = { method: 'POST', body: JSON.stringify({ ok: true }), headers: reqHeaders }
        const request = new Request('http://localhost:8080/', options)
        const req = new HTTPContextRequest(request)

        assertEquals(req.body, request.body)
        assertEquals(req.url, new URL(request.url))
        assertEquals(req.originalRequest, request)
        assertEquals(req.method, request.method)
        assertEquals(req.bodyUsed, request.bodyUsed)
        assertEquals(await req.json(), JSON.parse(options.body))
    })

    await t.step('params', () => {
        const request = new Request('http://localhost:8080/')
        const params = { userId: '200', messageId: '1000' }
        const req = new HTTPContextRequest(request, params)

        assertEquals(req.params.userId, params.userId)
        assertEquals(req.params.messageId, params.messageId)
    })
})
