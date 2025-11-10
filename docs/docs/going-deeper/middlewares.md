---
sidebar_position: 6
---

# Middleware

Just like many other web frameworks, Pashmak supports middlewares. Middlewares are pieces of code that wrap execution of controller methods. They can be used for various purposes such as authentication, logging, request modification, response modification, etc.

## types of middleware

There are 3 types of middlewares you can create:

### functional middlewares

similar to expressjs middlewares they are just functions that are executed at each request.
the major point is you need to call `await next()`, otherwise you can break the promise chain and cause unpredictable behaviors.

### Middleware Class

it is a class definition that extends Middleware class. Everytime a request is processed, a new instance of this class is created before executing the middleware part.
This is ideal for when you need to run a middleware where it needs to track some data from before and acter controller execution per each request.

### Middleware Object

There may exists situations where you want to save performance and not instantiate on every request.
or you want to be able to track data between requests.

## order of middleware execution

1. from global router
2. from class middlewares
3. from request method of controller class

## creating a functional middleware

```ts
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

NOTE: It is very important that you call `await next()` otherwise the promise chain will be broken and the request will not be processed.

## How to do random stuff

#### read response body after controller execution

Response object is actually node native `ServerResponse` response object. Within http and router modules, the response body is written by calling `res.end()` method.

```ts
import { ServerResponse } from "node:http";

return async function logResponse(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  const old_end = res.end;
  let buff_data = "";
  res.end = function (data: any, ...args: any[]) {
    if (data) {
      buff_data += data.toString();
    }
    old_end.apply(res, [data, ...args]);
  };

  await next();

  // now buff_data contains the full response body
  logger.info("Response Body:", { response_body: buff_data });
};
```

This solution should work in most cases. Keep in mind another way to write response body is using `res.write()` method. This method is used to write buffer and streams in case of large data or file responses.
