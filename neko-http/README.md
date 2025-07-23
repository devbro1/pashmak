# @devbro/neko-http

Context driven http server for @devbro/neko-router, with features to make life of developers simpler while keeping all the features we want.

## custom error handling

```ts
server.setErrorHandler((err: any, req: IncomingMessage, res: ServerResponse): Promise<void> {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('bad stuff happened');
});
```

## how to test http requests

```ts
import { Router } from '@devbro/neko-router';
import { HttpServer } from '@devbro/neko-http';

const router = new Router();
const server = new HttpServer();

server.setRouter(router);
const s = supertest(server.getHttpHanlder());
let r = await s.get('/');
```

## requestId

there is a context called requestId which is a unique identifier for every request that is handled, it is useful for tracking multiple logs.

```ts
router.addRoute(['GET'], '/', (req: Request, res: Response) => {
  let requestId = ctx().get('requestId') as String;
  return 'Hello World! ' + requestId;
});
```

if you want to modify requestId you can:

```ts
server.setRequestIdGenerator(func: (request: Request, response: ServerResponse) => number | string {
    return generateUUID();
});
```

keep in mind this run before all middlewares and controller.
