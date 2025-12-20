---
sidebar_position: 7
---

# Middleware

Just like any other web frameworks, Pashmak supports middlewares. Middlewares are pieces of code that wrap execution of controller methods. They can be used for various purposes such as authentication, logging, request modification, response modification, etc. Middlewares are functions, objects, or classes that can execute with direct access to the request and response objects. The main distinction between middlewares in Pashmak vs nestjs or express is that middlewares can execute code before AND after the controller method.

## types of middleware

There are 3 types of middlewares you can create:

### functional middlewares

similar to expressjs middlewares they are just functions that are executed at each request.

:::danger
the major point is you need to call `await next()` instead of `next()`, otherwise you can break the promise chain and cause unpredictable behaviors.

These unpredictable behaviors may include a code that is running even after response is sent to client, errors that are not captured by http error handler, error that response is already sent to client, etc.
:::

#### Example

```ts
import { Request, Response } from "@devbro/pashmak/router";

export async function requirePermissionsMiddleware(
  required_permissions: Permission | Permission[],
) {
  return async function (
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    let auth_user = ctx.get("getAuthenticatedUser");

    canUserOrFail(auth_user, required_permissions);

    try {
      // if you do not want to handle errors here, you can remove try catch block entirely
      await next();
      // post controller code
    } catch (error) {
      // error handling code if controller or any other middleware throws an error
      throw error;
    }
  };
}
```

### Middleware Class

It is a class definition that extends Middleware class. Everytime a request is processed, a new instance of this class is created before executing the middleware part.
This is ideal for when you need to run a middleware where it needs to track some data from before and acter controller execution per each request.

#### Example

```ts
import { Middleware, Request, Response } from "@devbro/pashmak/router";

export class ResponseLoggerMiddleware extends Middleware {
  static getInstance(params: any): Middleware {
    return new ResponseLoggerMiddleware(params);
  }
  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    await next();
  }
}
```

### Middleware Object

There may exists situations where you want to improve performance and not instantiate on every request.
or you want to be able to track data between requests. there are two approaches to do this. First use a singleton pattern within Middleware Class.
second use a Middleware Object.

#### Example of Singleton Middleware Class

```ts
import { Middleware, Request, Response } from "@devbro/pashmak/router";

export class RequestCounterMiddleware extends Middleware {
  static instance: RequestCounterMiddleware | undefined = undefined;
  counter: number = 0;

  static getInstance(params: any): Middleware {
    if (!this.instance) {
      this.instance = new RequestCounterMiddleware(params);
    }
    return this.instance;
  }

  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    this.counter++;
    await next();
  }
}

// Using Middlewares
router().addRoute(["GET"], "/api/v1/some-endpoint", someControllerMethod, {
  middlewares: [RequestCounterMiddleware],
});
```

#### Example of Middleware Object

```ts
import { Middleware, Request, Response } from "@devbro/pashmak/router";

export class RequestCounterMiddleware extends Middleware {
  counter: number = 0;

  constructor() {
    super();
  }

  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    this.counter++;
    await next();
  }
}

// Using Middlewares
router().addRoute(["GET"], "/api/v1/some-endpoint", someControllerMethod, {
  middlewares: [new RequestCounterMiddleware()],
});
```

The caveat of this approach is that this object is not shared with other routes. If you add a middleware object as global middleware to router, then it is shared with all routes within that router.

## order of middleware execution

1. from global router
2. from child router (if any)
3. from class middlewares
4. from request method of controller class or functional controller

```mermaid
graph LR
  http_req_res -->|1| middleware1
  middleware1 -->|2| middleware2
  middleware2 -->|3| middleware3
  middleware3 -->|4| Controller
  Controller -->|5| middleware3
  middleware3 -->|6| middleware2
  middleware2 -->|7| middleware1
  middleware1 -->|8| http_req_res

  http_req_res@{ label: "HTTP Connection" }
  middleware1@{ label: "Global middleware" }
  middleware2@{ label: "Controller class middleware" }
  middleware3@{ label: "Controller method middleware" }
```

numbers indicate the order of execution.

```ts
import { router } from "@devbro/pashmak/facades";

// 1. Global middleware (runs first)
router().addGlobalMiddleware(authMiddleware);

// 2. Controller-level middleware (runs second)
@Controller("/api/v1/users", {
  middlewares: [checkPermissions],
})
export class UserController extends BaseController {
  // 3. Method-level middleware (runs last)
  @Get({ middlewares: [logRequest] })
  async list() {
    return [];
  }
}
```

## Use Cases for Middlewares

#### read response body after controller execution

Response object is actually node native `ServerResponse` response object. Within http and router modules, the response body is written by calling `res.write()` or `res.end()` method.

```ts
import { Request, Response } from "@devbro/pashmak/router";

return async function logResponse(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  const old_end = res.write;
  let buff_data = "";
  res.write = function (data: any, ...args: any[]) {
    let buffered_data = "";
    if (data) {
      buffered_data = data.toString();
      buff_data += buffered_data;
    }
    old_end.apply(res, [buffered_data, ...args]);
  };

  await next();

  // now buff_data contains the full response body
  logger.info("Response Body:", { response_body: buff_data });
};
```

This solution should work in most cases. Keep in mind another way to write response body is using `res.write()` method. This method is used to write buffer and streams in case of large data or file responses.
