// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

// Test suites for all the components described in ../middleware.ts

import { Context } from '../context.ts'
import { assertEquals, assertRejects } from '../deps.ts'
import { combineMiddlewares, NextMiddleware } from '../middleware.ts'
import { HTTPResponse } from '../httpresponse.ts'
import { SequoiaError } from '../error.ts'
import { RouteHandler } from '../router.ts'
import { Middleware } from '../mod.ts'

function mockHandler(middleware: Middleware) {
    return new RouteHandler({
        path: '/',
        methods: ['GET'],
        static: false,
        root: '/',
        middleware,
    })
}

Deno.test('combineMiddlewares()', async () => {
    const context = new Context(new Request('http://localhost:8000/'))
    const testNumbers = [] as number[]

    const firstMiddleware = async (ctx: Context, next: NextMiddleware) => {
        ctx.response.headers.set('X-FirstMiddleware', 'True')
        testNumbers.push(1)
        await next()
    }
    const secondMiddleware = (ctx: Context) => {
        ctx.response.headers.set('X-SecondMiddleware', 'Also true')
        testNumbers.push(2)
        return new HTTPResponse('Hello world')
    }

    const handlers: RouteHandler[] = [
        mockHandler(firstMiddleware),
        mockHandler(secondMiddleware),
    ]

    const middleware = combineMiddlewares('/', handlers)
    const response = (await middleware(context))!.transform()
    assertEquals(response.headers.get('X-FirstMiddleware'), 'True')
    assertEquals(response.headers.get('X-SecondMiddleware'), 'Also true')
    assertEquals(await response.text(), 'Hello world')
    assertEquals(testNumbers, [1, 2])
})

Deno.test('combineMiddlewares(): execution order', async () => {
    const context = new Context(new Request('http://localhost:8000/'))
    const testNumbers = [] as number[]

    const firstMiddleware = async (_: Context, next: NextMiddleware) => {
        await next()
        testNumbers.push(1)
    }
    const secondMiddleware = async (_: Context, next: NextMiddleware) => {
        testNumbers.push(2)
        await next()
    }
    const thirdMiddleware = (_: Context) => {
        testNumbers.push(3)
        return new HTTPResponse('Hello world')
    }

    const handlers: RouteHandler[] = [
        mockHandler(firstMiddleware),
        mockHandler(secondMiddleware),
        mockHandler(thirdMiddleware),
    ]

    const middleware = combineMiddlewares('/', handlers)
    await middleware(context)
    assertEquals(testNumbers, [2, 3, 1])
})

Deno.test('Calling next multiple times throws', () => {
    const context = new Context(new Request('http://localhost:8000/'))
    const firstMiddleware = async (ctx: Context, next: NextMiddleware) => {
        ctx.response.headers.set('X-FirstMiddleware', 'True')
        await next()
        await next()
    }

    const handlers: RouteHandler[] = [mockHandler(firstMiddleware)]
    const middleware = combineMiddlewares('/', handlers)

    assertRejects(
        async () => await middleware(context),
        SequoiaError,
        'next() called multiple times',
    )
})
