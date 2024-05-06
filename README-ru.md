# Sequoia 🦕

[![Unit tests & linting](https://github.com/len0xx/sequoia/actions/workflows/deno.yml/badge.svg)](https://github.com/len0xx/sequoia/actions/workflows/deno.yml)

Библиотека для создания веб-серверов с помощью т.н. middleware. Написана на TypeScript, работает с Deno. Создана по подобию Oak

Официальный сайт: [sequoia.len0xx.ru](https://sequoia.len0xx.ru)

> English version is available at [/README.md](https://github.com/len0xx/sequoia/blob/main/README.md)

## Почему выбрать Sequoia?

`Sequoia` разрабатывалась с целью улучшения DevEx (Developer Experience) для тех, кто занимается разработкой API на `Node.js/Deno`. `Node.js` имеет множество недостатков по сравнению с его младшим братом `Deno`. Поэтому начальной точкой для разработки библиотеки послужил именно `Deno`. Возможно в будущем библиотека будет адаптирована для использования с `Node.js`. Больше о преимуществах `Deno` можно почитать на [официальном сайте](https://deno.com)

Вы можете рассматривать `Sequoia` как улучшенную и упрощенную версию `Express` или `Oak`. Так как на данный момент у этих библиотек очень много общего, однако в будущем это вполне вероятно изменится

Переходя к примерам, если вы когда-то занимались разработкой API на `Node.js` или `Deno`, то следующий код может быть вам знаком:
```javascript
// express.js
app.get('/', (req, res) => {
    const body = { ok: true, user: { id: 1, name: 'John Doe' } }
    res.status(201).json(body).cookie('access_token', 'a62bc1')
})
```

Цепочка вызовов `res.status(201).json(body).cookie('access_token', 'a62bc1')` это не лучший способ описания того, что делает этот код

`Sequoia` же даёт возможность описать этот код более декларативно:
```javascript
// Sequoia
app.GET('/', (ctx) => {
    const body = { ok: true, user: { id: 1, name: 'John Doe' } }
    ctx.cookies.set('access_token', 'a62bc1')

    return new HTTPResponse({
        status: HTTPStatus.CREATED,
        type: 'application/json',
        body
    })
})
```

Middleware-функции занимаются обработкой поступающих HTTP-запросов и в конечном счёте должны привести к тому, чтобы пользователь веб-сайта или веб-сервиса получил HTTP-ответ.
Поэтому ключевой фишкой `Sequoia` служит то, что все Middleware-функции должны либо возвращать `HTTPResponse`, либо вызывать функцию `next()`, которая предполагает выполнение следующего обработчика запроса

Класс `HTTPResponse` служит промежуточным слоем между разработчиком и тем ответом, который будет отправлен пользователю.
Использование этого класса предоставляет более богатое автодополнение кода в вашей IDE.
Это позволяет сделать создание API более приятным процессом

<img width="847" alt="image" src="https://github.com/len0xx/sequoia/assets/21990466/e1b46f6f-fcb2-479e-be14-066ed152dd44">

`Sequoia` написана в соответствии со всеми современными трендами в веб-разработке, поэтому в исходном коде используется TypeScript для 100% файлов. Однако для использования библиотеки вы не ограничены TypeScript, это опционально

## Использование

### Прежде чем начать

Чтобы воспользоваться библиотекой, необходимо сначала установить Deno (`v1.35.0` или новее) локально. [Гайды по установке](https://deno.land/manual@v1.30.3/getting_started/installation)

### Первые шаги

Использование Sequoia может быть очень похожим на использование `Oak`, `Koa`, `Express` или других подобных библиотек

> **Внимание**: Проект до сих пор находится на стадии `Beta`. Внутренний API библиотеки может измениться после достижения версии `1.0.0`

Чтобы создать простой веб-сервер, воспользуйтесь этим примером:
```javascript
// example.ts
import { Application, Router, HTTPStatus, HTTPResponse } from 'jsr:@sequoia/sequoia'

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

const HOST = Deno.env.get('HOST') ?? '0.0.0.0'
const PORT = Number(Deno.env.get('PORT') ?? 80)

app.listen(
    { hostname: HOST, port: PORT },
    () => console.log('The sequoia server is up!')
)
```

Чтобы запустить его, выполните команду:

`deno run --allow-net --allow-env example.ts`

Если вы хотите запустить его на нестандартном IP адресе или порту, воспользуйтесь переменными окружения:

`HOST=0.0.0.0 PORT=4000 deno run --allow-net --allow-env example.ts`

После этого вы можете перейти по адресу `http://localhost:8000` в браузере и увидеть текст наподобие `{ 'ok': true, 'agent': 'curl/7.85.0' }`

Больше примеров можно найти на сайте: **[examples](https://sequoia.len0xx.ru/guides)**

## Производительность

Одно из главных целей при разработке `Sequoia` была производительность. Для того, чтобы измерить эту производительность, были выполнены несколько бенчмарков. Для сравнения те же самые бенчмарки были запущены для серверов на нативном `Deno` и `Express`. Ниже можно ознакомиться с результатами:

> RPS - Количество выполненных запросов за секунду (Requests per second)

Sequoia benchmark (46956 RPS):
```
Concurrency Level:      100
Time taken for tests:   21.296 seconds
Complete requests:      1000000
Failed requests:        0
Total transferred:      150000000 bytes
HTML transferred:       11000000 bytes
Requests per second:    46956.41 [#/sec] (mean)
Time per request:       2.130 [ms] (mean)
Time per request:       0.021 [ms] (mean, across all concurrent requests)
Transfer rate:          6878.38 [Kbytes/sec] received
```

Deno benchmark (55536 RPS):
```
Concurrency Level:      100
Time taken for tests:   18.006 seconds
Complete requests:      1000000
Failed requests:        0
Total transferred:      150000000 bytes
HTML transferred:       11000000 bytes
Requests per second:    55536.75 [#/sec] (mean)
Time per request:       1.801 [ms] (mean)
Time per request:       0.018 [ms] (mean, across all concurrent requests)
Transfer rate:          8135.27 [Kbytes/sec] received
```

Express (on Node.js) benchmark (11293 RPS):
```
Concurrency Level:      100
Time taken for tests:   88.543 seconds
Complete requests:      1000000
Failed requests:        0
Total transferred:      211000000 bytes
HTML transferred:       12000000 bytes
Requests per second:    11293.98 [#/sec] (mean)
Time per request:       8.854 [ms] (mean)
Time per request:       0.089 [ms] (mean, across all concurrent requests)
Transfer rate:          2327.18 [Kbytes/sec] received
```

Команда для запуска бенчмарка: `ab -n 1000000 -c 100 127.0.0.1:8000`

Данные бенчмарки были запущены на виртуальной машине (Debian linux) с 2 ядрами ЦПУ (3.5 ГГц) и 2 Гб ОЗУ

## Дальнейшие планы

На данный момент Sequoia разрабатывается только одним человеком ([@len0xx](https://github.com/len0xx)), однако любые предложения по улучшению библиотеки приветствуются в разделе [Issues](https://github.com/len0xx/sequoia/issues)

Запланированные улучшения в ближайших релизах:

- [x] Возможность раздавать статические файлы с помощью CLI команды
- [x] Описать примеры использования библиотеки в GitHub Wiki
- [x] Поддержка HTTP CORS заголовков
- [x] Обновить внутренний API до `Deno.serve()`
- [x] Модульные тесты и CI/CD с помощью GitHub Actions
- [x] Опубликовать библиотеку на `JSR.io`
- [ ] Поддержка TLS
- [ ] Поддержка загрузки файлов
- [ ] Поддержка WebSockets
- [ ] Улучшенная совместимость с `svelte-adapter-deno`
- [ ] Поддержка HTTP заголовков для сжатия
- [ ] Улучшенная документация
- [ ] Имплементация простого в использовании и конфигурации класса для раздачи статических файлов
