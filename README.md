# Sequoia

A web-server for Deno based on middlewares

Simple usage example:
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
const APP_PORT = Number(Deno.env.get('APP_PORT') ?? 80)

app.listen(
	{ hostname: APP_IP, port: APP_PORT },
	() => console.log('The sequoia server is up!')
)
```

To run this example just use:
`deno run --allow-net --allow-env example.ts`
