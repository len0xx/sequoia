// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the utilities described in ../util.ts

import { HTTPHandler } from '../middleware.ts'
import { HTTPResponse } from '../mod.ts'
import {
    combineHeaders,
    convertToBody,
    defineContentType,
    extractParams,
    isRegExp,
    normalizePath,
    parseCookies,
    splitPath,
} from '../util.ts'
import { isWindows } from '../deps.ts'
import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.204.0/assert/mod.ts'

Deno.test('defineContentType', async (t) => {
    await t.step('image/jpeg', () => {
        const content = defineContentType('name.jpg')
        assertEquals(content, 'image/jpeg')
    })

    await t.step('image/png', () => {
        const content = defineContentType('name.png')
        assertEquals(content, 'image/png')
    })

    await t.step('image/webp', () => {
        const content = defineContentType('name.webp')
        assertEquals(content, 'image/webp')
    })

    await t.step('image/svg+xml', () => {
        const content = defineContentType('name.svg')
        assertEquals(content, 'image/svg+xml')
    })

    await t.step('image/gif', () => {
        const content = defineContentType('name.gif')
        assertEquals(content, 'image/gif')
    })

    await t.step('video/mpeg', () => {
        const content = defineContentType('name.mpeg')
        assertEquals(content, 'video/mpeg')
    })

    await t.step('video/mp4', () => {
        const content = defineContentType('name.mp4')
        assertEquals(content, 'video/mp4')
    })

    await t.step('video/webm', () => {
        const content = defineContentType('name.webm')
        assertEquals(content, 'video/webm')
    })

    await t.step('application/json', () => {
        const content = defineContentType('name.json')
        assertEquals(content, 'application/json; charset=UTF-8')
    })

    await t.step('application/javascript', () => {
        const content = defineContentType('name.js')
        assertEquals(content, 'application/javascript; charset=UTF-8')
    })

    await t.step('application/pdf', () => {
        const content = defineContentType('name.pdf')
        assertEquals(content, 'application/pdf')
    })

    await t.step('application/php', () => {
        const content = defineContentType('name.php')
        assertEquals(content, 'application/x-httpd-php')
    })

    await t.step('application/xml', () => {
        const content = defineContentType('name.xml')
        assertEquals(content, 'application/xml')
    })

    await t.step('application/zip', () => {
        const content = defineContentType('name.zip')
        assertEquals(content, 'application/zip')
    })

    await t.step('audio/mpeg', () => {
        const content = defineContentType('name.mp3')
        assertEquals(content, 'audio/mpeg')
    })

    await t.step('audio/ogg', () => {
        const content = defineContentType('name.ogg')
        assertEquals(content, 'audio/ogg')
    })

    await t.step('text/plain', () => {
        const content = defineContentType('name.txt')
        assertEquals(content, 'text/plain; charset=UTF-8')
    })

    await t.step('text/css', () => {
        const content = defineContentType('name.css')
        assertEquals(content, 'text/css; charset=UTF-8')
    })

    await t.step('text/html', () => {
        const content = defineContentType('name.html')
        assertEquals(content, 'text/html; charset=UTF-8')
    })
})

Deno.test('Normalize path', async (t) => {
    await t.step('Remove trailing slash', () => {
        const source = '/foo/bar/'
        const result = normalizePath(source, true)
        const expected = isWindows ? '\\foo\\bar' : '/foo/bar'
        assertEquals(result, expected)
    })

    await t.step('Append leading slash', () => {
        const source = 'foo/bar'
        const result = normalizePath(source, true)
        const expected = isWindows ? '\\foo\\bar' : '/foo/bar'
        assertEquals(result, expected)
    })
})

Deno.test('Convert to body', async (t) => {
    await t.step('Transform plain JS object into JSON', () => {
        const source = { ok: true }
        const result = convertToBody(source)
        assertEquals(result, JSON.stringify(source))
    })

    await t.step('Other allowed types remain the same: Blob', () => {
        const source = new Blob()
        const result = convertToBody(source)
        assertInstanceOf(result, Blob)
    })

    await t.step('Other allowed types remain the same: FormData', () => {
        const source = new FormData()
        const result = convertToBody(source)
        assertInstanceOf(result, FormData)
    })

    await t.step('Other allowed types remain the same: URLSearchParams', () => {
        const source = new URLSearchParams()
        const result = convertToBody(source)
        assertInstanceOf(result, URLSearchParams)
    })

    await t.step('Other allowed types remain the same: ReadableStream', () => {
        const source = new ReadableStream()
        const result = convertToBody(source)
        assertInstanceOf(result, ReadableStream)
    })

    await t.step('Other allowed types remain the same: string', () => {
        const source = 'hello world'
        const result = convertToBody(source)
        assertEquals(result, source)
    })
})

Deno.test('isRegExp', async (t) => {
    await t.step('true', () => {
        const source = /[a-z]{3}/
        const result = isRegExp(source)
        assertEquals(result, true)
    })

    await t.step('false', () => {
        const source = '/abc'
        const result = isRegExp(source)
        assertEquals(result, false)
    })
})

Deno.test('splitPath', async (t) => {
    await t.step('empty', () => {
        const source = '/'
        const result = splitPath(source)
        assertEquals(result, [])
    })

    await t.step('default', () => {
        const source = '/foo/bar/baz'
        const result = splitPath(source)
        assertEquals(result, ['foo', 'bar', 'baz'])
    })

    await t.step('skip empty segments', () => {
        const source = '/foo///bar/baz'
        const result = splitPath(source)
        assertEquals(result, ['foo', 'bar', 'baz'])
    })
})

Deno.test('parseCookies', async (t) => {
    await t.step('empty', () => {
        const source = ''
        const result = parseCookies(source)
        assertEquals(result, {})
    })

    await t.step('simple example', () => {
        const source = 'token=AyshjSyc;example=SbhSDydj2'
        const result = parseCookies(source)
        const cookies = {
            token: 'AyshjSyc',
            example: 'SbhSDydj2',
        }
        assertEquals(result, cookies)
    })
})

Deno.test('combineHeaders', async (t) => {
    await t.step('empty', () => {
        const source = new Headers()
        const source2 = new Headers()
        const result = combineHeaders(source, source2)
        assertEquals(result.get('test'), null)
    })

    await t.step('two headers sets', () => {
        const source = new Headers()
        source.set('test', 'foo')
        const source2 = new Headers()
        source2.set('bar', 'test')
        const result = combineHeaders(source, source2)
        assertEquals(result.get('test'), 'foo')
        assertEquals(result.get('bar'), 'test')
    })
})

Deno.test('extractParams', async (t) => {
    const handler: HTTPHandler = {
        path: '/',
        root: '/',
        methods: ['GET'],
        middleware: () => new HTTPResponse('Test'),
        static: false,
    }

    await t.step('single param', () => {
        handler.path = '/:id'
        const result = extractParams(handler, '/10')
        assertEquals(result.id, '10')
    })

    await t.step('two params', () => {
        handler.path = '/:author/:id'
        const result = extractParams(handler, '/len0xx/10')
        assertEquals(result.id, '10')
        assertEquals(result.author, 'len0xx')
    })

    await t.step('three params', () => {
        handler.path = '/:author/:id/:comment'
        const result = extractParams(handler, '/len0xx/10/2')
        assertEquals(result.id, '10')
        assertEquals(result.author, 'len0xx')
        assertEquals(result.comment, '2')
    })

    await t.step('more complex example', () => {
        handler.path = '/order-:id'
        const result = extractParams(handler, '/order-ABC')
        assertEquals(result.id, 'ABC')
    })

    await t.step('only numeric param', () => {
        handler.path = '/:number(\\d+)'
        const result = extractParams(handler, '/1024')
        assertEquals(result.number, '1024')
    })

    // TODO: Add more tests
})
