---
sidebar_position: 4
---

# Router

Router facade is the backbone of http server to connect different routes to your controllers.

```ts
import { Request, Response } from "@devbro/pashmak/router";
import { router } from "@devbro/pashmak/facades";

import { CatController } from "./app/controllers/CatController";
import { AnimalController } from "./app/controllers/AnimalController";
import { loggerMiddleware, logResponseMiddleware } from "./middlewares";

router.addGlobalMiddleware(loggerMiddleware);

router().addRoute(
  ["GET", "HEAD"],
  "/api/v1/countries",
  async (req: any, res: any) => {
    return { yey: "GET countries" };
  },
);

router.addRoute("GET", "/api/v1/countries", async (req: any, res: any) => {
  return { yey: "GET countries" };
});

router
  .addRoute(["GET", "HEAD"], "/api/v1/regions", async (req: any, res: any) => {
    return { yey: "GET regions" };
  })
  .addMiddleware(logResponseMiddleware);

router.addController(CatController);
router.addController(AnimalController);
```

router manages both middlewares and controlers.

controller can be either a Controller class or an async function that gets a request and response object.

## functional controller

basic format of a functional controller is:

```ts
async (req: Request, res: Response) => {
  return { message: "GET regions" };
};
```

if you want to do more complex returns you can directly modify Response.

> [!CAUTION]
> Response and Request objects are NOT the standard objects defined as part of node, make sure to import them from @pashmak.

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  res.writeHead(418, { "Content-Type": "text/plain" });
  res.end("Can you guess what I am?");
};
```

## Error handling

Router is able to handle error by default. If you throw any error of type `HttpError`, httpserver can render them as json right away. If error is of any other type, server will return a generic 500 error.

```ts
import { Request, Response } from "@devbro/pashmak/router";
import { HttpError, HTTPUnauthorizedError } from "@devbro/pashmak/http";
async (req: Request, res: Response) => {
  throw new HTTPUnauthorizedError();
};
```

if you want to have your own custom error handler you can:

```ts
import { server } from '@devbro/pashmak/facades';

server().setErrorHandler(async (err: Error, req: any, res: any) => {
  // ???
}
```

## Nesting Routers

There will be situations where we need to simplify our routers using prefix or having
middlewares that are applied to subset of routes. The simple solution is to create a new
router and use addRouter to add it to main router.

```ts
import { router } from "@devbro/pashmak/facades";
import { Router } from "@devbro/pashmak/router"; // Capital Class Name

router().addRoute(
  ["GET", "HEAD"],
  "/api/v1/meow",
  async (req: any, res: any) => {
    return { message: "meow meow!" };
  },
);

let authnedRouter = new Router();

// add routes
authnedRouter.addController(OrganizationController);
authnedRouter.addController(UserController);

// add middlewares
authnedRouter.addGlobalMiddleware([authenticate]);

router().addRouter("/api/v1", authnedRouter);
// or
router().addRouter("", authnedRouter); // prefix can be empty string
```
