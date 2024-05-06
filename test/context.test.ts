// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../context.ts

import { Context } from '../context.ts'
import { assertEquals } from '../deps.ts'
import { ContentType } from '../media.ts'
import { HTTPStatus } from '../status.ts'
import { TERMINATING_SYMBOL } from '../util.ts'

Deno.test({
    name: 'Context class',
    permissions: { read: ['test'] },
    fn: async (t) => {
        await t.step('constructor', async () => {
            const urlText = 'http://localhost:8080/'
            const url = new URL(urlText)
            const headers = new Headers()
            const token = '1Sjnv2Suvh6eN9Jves'
            headers.set('cookie', `token=${token}`)
            const request = new Request(urlText, { headers })
            const context = new Context(request)

            assertEquals(context.response.status, HTTPStatus.SUCCESS)
            assertEquals(context.response.body, null)
            assertEquals(await context.request.text(), '')
            assertEquals(context.request.url, url)
            assertEquals(context.cookies.get('token')?.value, token)
            assertEquals(context.cookies.size(), 1)
        })

        await t.step('send() method', async () => {
            const urlText = 'http://localhost:8080/text.txt'
            const request = new Request(urlText)
            const context = new Context(request)

            const response = await context.send({
                root: './test/assets',
                path: '/',
                extensions: ['txt'],
            })
            assertEquals(response.type, ContentType.PLAIN)
            assertEquals(await response.transform().text(), 'Hello Sequoia' + TERMINATING_SYMBOL)
        })
    },
})
