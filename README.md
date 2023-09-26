# Sequoia 🦕

A library for handling HTTP requests by using middlewares. Inspired by [Oak](https://github.com/oakserver/oak). Written in TypeScript, works with Deno runtime

## Usage

### Prerequisites

To use this library you obviously need Deno (`v1.30.3` or later) to be install on your machine. Check out the [installation guide](https://deno.land/manual@v1.30.3/getting_started/installation)

### Getting started

Using Sequoia might seem familiar to those who had some experience with Oak, Koa, Express or any other middleware library.

> **Warning**: The project is still in Beta stage. So the API and the provided functionality might change after achieving `v1.0.0`

To get started you can use this example:
```javascript
// example.ts
import { Application, Router, HTTPStatus, HTTPResponse } from 'https://deno.land/x/sequoia/mod.ts'

const app = new Application({ logging: true })
const router = new Router({ type: 'application/json' })

router.GET('/', (ctx) => {
    const agent = ctx.request.headers.get('User-Agent')
    ctx.response.headers.set('X-Powered-By', 'Sequoia')
    ctx.cookies.set('WebServer', 'Sequoia')

    return new HTTPResponse({
        status: HTTPStatus.SUCCESS,
        body: { ok: true, agent }
    })
})

app.useRouter(router)

const APP_IP = Deno.env.get('APP_IP') ?? '127.0.0.1'
const APP_PORT = Number(Deno.env.get('APP_PORT') ?? 8000)

app.listen(
    { hostname: APP_IP, port: APP_PORT },
    () => console.log('The sequoia server is up!')
)
```

To run this example just use:

`deno run --allow-net --allow-env example.ts`

After running this command the server is running, so you can go to `http://localhost:8000` in your browser and there you can see the response which might look like this: `{ 'ok': true, 'agent': 'curl/7.85.0' }`

To see more examples visit: [examples](https://github.com/len0xx/sequoia/blob/main/examples)
