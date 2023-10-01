# Sequoia 🦕

A library for handling HTTP requests by using middlewares. Written in TypeScript, works with Deno runtime. Inspired by [Oak](https://github.com/oakserver/oak)

> Русская версия доступна тут: [/README-ru.md](https://github.com/len0xx/sequoia/blob/main/README-ru.md)

## Why Sequoia?

`Sequoia` was developed to enhance the Developer Experience for those who create APIs with `Node.js/Deno`. `Node.js` has a lot of disadvantages compared to `Deno`. That's why `Sequoia` was developed first for `Deno`. Probably it will be adapted to work with `Node.js` in the future. Read more about `Deno` on the website

You may consider `Sequoia` as an advanced and simplified version of `Express` or `Oak`. Because for now the libraries have a lot of similarities, but it's a subject to change in the future

Moving to the examples, if you've ever developed an API in `Node.js` or `Deno`, this code might look familiar to you:
```javascript
// express.js
app.get('/', (req, res) => {
    const body = { ok: true, user: { id: 1, name: 'John Doe' } }
    res.status(201).json(body).cookie('access_token', 'Bearer a62bc1')
})
```

A chain of methods like this `res.status(201).json(body).cookie('access_token', 'Bearer a62bc1')` is not a great example of Developer Experience

Sequoia on the other hand provides you a better way to do this:
```javascript
// Sequoia
app.GET('/', (ctx) => {
    const body = { ok: true, user: { id: 1, name: 'John Doe' } }
    ctx.cookies.set('access_token', 'Bearer a62bc1')

    return new HTTPResponse({
        status: HTTPStatus.CREATED,
        type: 'application/json',
        body
    })
})
```

In Sequoia there is an `HTTPResponse` class which stands in-between the developer and the actual `Response` object that is being sent to the user. While using this class you are getting the great intellisense in your IDE and creating APIs become a much more pleasant experience

<img width="847" alt="image" src="https://github.com/len0xx/sequoia/assets/21990466/e1b46f6f-fcb2-479e-be14-066ed152dd44">

## Usage

### Prerequisites

To use this library you obviously need Deno (`v1.30.3` or later) to be install on your machine. Check out the [installation guide](https://deno.land/manual@v1.30.3/getting_started/installation)

### Getting started

Using `Sequoia` might seem familiar to those who had some experience with `Oak`, `Koa`, `Express` or any other middleware library.

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

const HOST = Deno.env.get('HOST') ?? '127.0.0.1'
const PORT = Number(Deno.env.get('PORT') ?? 8000)

app.listen(
    { hostname: HOST, port: PORT },
    () => console.log('The sequoia server is up!')
)
```

To run this example just use:

`deno run --allow-net --allow-env example.ts`

To run it on custom IP or port, simply define them as environment variables:

`HOST=0.0.0.0 PORT=4000 deno run --allow-net --allow-env example.ts`

After running this command the server is running, so you can go to `http://localhost:8000` in your browser and there you can see the response which might look like this: `{ 'ok': true, 'agent': 'curl/7.85.0' }`

To see more examples visit: **[examples](https://github.com/len0xx/sequoia/wiki)**

## Roadmap

Right now Sequoia is only maintained by its original creator ([@len0xx](https://github.com/len0xx)), though anyone on the internet is welcome to contribute. So new features of a library depend directly on the free time of its maintainer. Do not expect releases too often. 

The features that are expected in the upcoming releases:

- [x] Allow serving static files via CLI
- [x] Describe examples in Wiki
- [ ] Support for TLS
- [ ] Unit tests and CI/CD through GitHub Actions
- [ ] Support for WebSockets
- [ ] Better compatibility with `svelte-adapter-deno`
- [ ] Support for compression and other HTTP headers
- [ ] Better documentation on `deno.land`
- [ ] Host the library outside of `deno.land`
