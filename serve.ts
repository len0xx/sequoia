// Copyright 2023-2024 the Sequoia authors. All rights reserved. MIT license.

import { Application } from './mod.ts'
import { Router } from './router.ts'
import { parseArgs, stdPath } from './deps.ts'

const pathArg = Deno.args[0]
const flags = parseArgs(Deno.args, {
    string: ['hostname', 'port'],
})
const HOSTNAME = flags.hostname ?? '0.0.0.0'
const PORT = flags.port ? +flags.port : 8080

if (!pathArg) {
    throw new Deno.errors.NotFound(
        'Please specify a path to serve. Example: deno run -A serve.ts build/static',
    )
}

const PATH = stdPath.normalize(pathArg)
const app = new Application()

app.useRouter('/', new Router().static('/', PATH))

app.listen(
    { hostname: HOSTNAME, port: PORT },
    () => {
        console.log(`Sequoia server is running at http://${HOSTNAME}:${PORT}`)
        console.log(`Now serving ${PATH}`)
    },
)
