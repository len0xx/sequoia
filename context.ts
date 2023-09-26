// Copyright 2023 the Sequoia authors. All rights reserved. MIT license.

import { HTTPStatus } from './status.ts'
import { parseCookies } from './util.ts'
import { CookieStorage } from './cookie.ts'
import { HTTPContextRequest } from './httprequest.ts'
import { HTTPContextResponse, HTTPResponse } from './httpresponse.ts'
import type { RouteParams } from './router.ts'
import { serveStatic } from './static.ts'

export type SendOptions = {
    path: string
    root: string
    extensions: string[]
}

export class Context<
    ParamsT extends Record<string, string> = RouteParams,
    RequestT extends HTTPContextRequest<ParamsT> = HTTPContextRequest<ParamsT>,
    ResponseT extends HTTPContextResponse = HTTPContextResponse,
> {
    readonly request: RequestT
    readonly response: ResponseT
    readonly cookies: CookieStorage

    constructor(request: Request) {
        this.response = new HTTPResponse({
            status: HTTPStatus.SUCCESS,
            body: null,
        }) as ResponseT
        this.request = new HTTPContextRequest<ParamsT>(request) as RequestT

        const cookies = request.headers.get('cookie')
        this.cookies = new CookieStorage(cookies ? parseCookies(cookies) : undefined)
    }

    public send = async (options: SendOptions): Promise<HTTPResponse> => {
        return await serveStatic(this.request.url, '/', options.root)
    }
}
