// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../static.ts

import { fileExists, serveFile, serveStatic } from '../static.ts'
import { assertEquals } from '../deps.ts'
import { ContentType } from '../media.ts'

Deno.test({
    name: 'fileExists()',
    permissions: { read: ['test'] },
    fn: async () => {
        assertEquals(await fileExists('./test/assets'), false)
        assertEquals(await fileExists('./test/assets/non-existent.txt'), false)
        assertEquals(await fileExists('./test/assets/text.txt'), true)
    },
})

Deno.test({
    name: 'serveFile()',
    permissions: { read: ['test'] },
    fn: async (t) => {
        await t.step('text file', async () => {
            const response = await serveFile('./test/assets/text.txt')
            const res = response.transform()
            assertEquals(await res.text(), 'Hello Sequoia\n')
            assertEquals(res.headers.get('Content-Type'), ContentType.PLAIN)
        })
    },
})

Deno.test({
    name: 'serveStatic()',
    permissions: { read: ['test'] },
    fn: async (t) => {
        await t.step('text file', async () => {
            const url = new URL('http://localhost:8080/docs/text.txt')
            const response = await serveStatic(url, '/docs', './test/assets')
            const res = response.transform()
            assertEquals(await res.text(), 'Hello Sequoia\n')
            assertEquals(res.headers.get('Content-Type'), ContentType.PLAIN)
        })
    },
})
