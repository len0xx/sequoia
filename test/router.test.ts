// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../router.ts

import { assertEquals } from '../deps.ts'
import { HTTPResponse } from '../httpresponse.ts'
import { ContentType } from '../media.ts'
import { RouteHandler, Router, RouterOptions } from '../router.ts'
import { HTTPStatus } from '../status.ts'

Deno.test('RouteHandler class', async (t) => {
    const middleware = () => new HTTPResponse('Hello world')

    await t.step('constructor', () => {
        const routerOptions: RouterOptions = {
            status: HTTPStatus.CREATED,
            type: ContentType.PLAIN,
        }
        const handler = new RouteHandler({
            path: '/',
            methods: ['GET'],
            middleware: middleware,
            static: false,
            routerOptions: routerOptions,
            root: '/',
        })

        assertEquals(handler.path, '/')
        assertEquals(handler.methods, ['GET'])
        assertEquals(handler.middleware, middleware)
        assertEquals(handler.static, false)
        assertEquals(handler.options, routerOptions)
        assertEquals(handler.root, '/')
    })

    await t.step('match() method (#1)', () => {
        const handler = new RouteHandler({
            path: '/',
            methods: ['GET'],
            middleware: middleware,
            static: false,
            root: '/',
        })

        assertEquals(handler.match('/anything', 'GET'), false)
        assertEquals(handler.match('/', 'POST'), false)
        assertEquals(handler.match('/anything', 'POST'), false)
        assertEquals(handler.match('/', 'GET'), true)
    })

    await t.step('match() method (#2)', () => {
        const handler = new RouteHandler({
            path: '/user/:id',
            methods: ['POST'],
            middleware: middleware,
            static: false,
            root: '/',
        })

        assertEquals(handler.match('/', 'GET'), false)
        assertEquals(handler.match('/', 'POST'), false)
        assertEquals(handler.match('/user', 'POST'), false)
        assertEquals(handler.match('/user/10', 'POST'), true)
    })

    await t.step('match() method (#3)', () => {
        const handler = new RouteHandler({
            path: /[abc]{3}/,
            methods: [],
            middleware: middleware,
            static: true,
            root: '/folder',
        })

        assertEquals(handler.match('/', 'GET'), false)
        assertEquals(handler.match('/folder', 'GET'), false)
        assertEquals(handler.match('/folder', 'PATCH'), false)
        assertEquals(handler.match('/folder/test', 'POST'), false)
        assertEquals(handler.match('/folder/bay', 'POST'), false)
        assertEquals(handler.match('/folder/bbb', 'HEAD'), true)
        assertEquals(handler.match('/folder/cbb', 'GET'), true)
        assertEquals(handler.match('/folder/aac', 'POST'), true)
        assertEquals(handler.match('/folder/bac', 'DELETE'), true)
    })
})

Deno.test('Router class', async (t) => {
    const router = new Router()
    const middleware = () => new HTTPResponse('Hello world')

    await t.step('middleware registry', () => {
        router.GET('/', middleware)
        let handlers = router.getHandlers()

        assertEquals(handlers.length, 1)
        assertEquals(handlers[0].middleware, middleware)
        assertEquals(handlers[0].methods, ['GET'])
        assertEquals(handlers[0].path, '/')
        assertEquals(handlers[0].static, false)

        router.POST('/upload', middleware)
        handlers = router.getHandlers()

        assertEquals(handlers.length, 2)
        assertEquals(handlers[1].middleware, middleware)
        assertEquals(handlers[1].methods, ['POST'])
        assertEquals(handlers[1].path, '/upload')
        assertEquals(handlers[1].static, false)

        router.all('/user/:name', middleware)
        handlers = router.getHandlers()

        assertEquals(handlers.length, 3)
        assertEquals(handlers[2].middleware, middleware)
        assertEquals(handlers[2].methods, [])
        assertEquals(handlers[2].path, '/user/:name')
        assertEquals(handlers[2].static, false)

        router.static('/files', './dist/files')
        handlers = router.getHandlers()

        assertEquals(handlers.length, 4)
        assertEquals(handlers[3].methods, ['GET'])
        assertEquals(handlers[3].path, '/files')
        assertEquals(handlers[3].static, true)
    })
})
