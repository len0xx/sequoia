// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

/**
 * ### Sequoia
 * A library for creating clean and minimalistic HTTP servers.
 * It is inspired by Oak and it is mostly compatible with it.
 *
 * ### Getting started
 * To get started you can create your own server using this snippet:
 * ```ts
 * // server.ts
 * import { Application, Router, HTTPStatus, HTTPResponse } from 'https://deno.land/x/sequoia/mod.ts'
 *
 * const app = new Application()
 * const router = new Router()
 *
 * router.GET('/', (ctx) => {
 *     return new HTTPResponse({
 * 	      status: HTTPStatus.SUCCESS,
 * 	      type: 'application/json',
 * 	      body: { ok: true, healthcheck: 'success' }
 *     })
 * })
 *
 * app.useRouter(router)
 *
 * app.listen({ port: 8000 })
 * ```
 *
 * Then you can run the created server by running: `deno run --allow-net server.ts`
 *
 * It will spin up a server at `http://localhost:8000`. This server will respond with a JSON `{ ok: true, healthcheck: 'success' }`
 *
 * ### What's the difference from Oak?
 *
 * The main difference that Sequoia has over Oak is the simplified approach to sending responses:
 * ```ts
 * // oak.ts
 * (ctx) => {
 *     ctx.response.status = 200
 *     ctx.response.headers.set('Content-Type', 'application/json')
 *     ctx.response.body = JSON.stringify({ ok: true, healthcheck: 'success' })
 * }
 *
 * // sequoia.ts
 * (ctx) => {
 *     return new HTTPResponse({
 *         status: HTTPStatus.SUCCESS,
 *         type: 'application/json',
 *         body: { ok: true, healthcheck: 'success' }
 *     })
 * }
 * ```
 *
 * The examples above create the identical Response object, but in sequoia we aim to give the best developer expirience possible. So instead of setting each property of response one by one you can just return the HTTPResponse object from the middleware. In addition to that there is an enum HTTPStatus which is basically identical to Deno's native Status enum (you can use both of them).
 *
 * @module
 */

export * from './app.ts'
export { Router, type RouteParams } from './router.ts'
export { HTTPError, type ErrorHandler } from './error.ts'
export { type HTTPContextResponse, HTTPResponse } from './httpresponse.ts'
export { HTTPContextRequest } from './httprequest.ts'
export { HTTPStatus } from './status.ts'
export type { Middleware, MiddlewareReturn, NextMiddleware } from './middleware.ts'
export { redirect } from './util.ts'
export * from './context.ts'
