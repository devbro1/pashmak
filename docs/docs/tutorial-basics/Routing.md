---
sidebar_position: 4
---

# Router

Pashmak uses facade pattern to simplify access to core components. The Router facade is the main provider of available http routes to http server.

## Basic Usage

```ts
import { Request, Response } from "@devbro/pashmak/router";
import { router } from "@devbro/pashmak/facades";
import { CatController } from "@/app/controllers/CatController";
import { AnimalController } from "@/app/controllers/AnimalController";
import { loggerMiddleware, logResponseMiddleware } from "@/middlewares";

// Add global middleware (applies to all routes)
router().addGlobalMiddleware(loggerMiddleware);

// Add a functional route
router()
  .addRoute(
    ["GET", "HEAD"],
    "/api/v1/countries",
    async (req: Request, res: Response) => {
      return { message: "GET countries" };
    },
  )
  .addMiddleware(logResponseMiddleware);

// Register class-based controllers
router().addController(CatController);

// Nesting routers for better organization
let authnedRouter = new Router();
authnedRouter.addController(AnimalController);
authnedRouter.addGlobalMiddleware([authenticate]);
router().addRouter("/api/v1", authnedRouter);
```

## Url structuring

Pashmak requires valid url structure for routing. Url can be made of following parts:

- Static parts: e.g. `/api/v1/cats`
- Parameter parts: e.g. `/api/v1/cats/:id` where `:id` is a parameter part
- Wildcard parts: e.g. `/public/*filepath` where `*filepath` matches all remaining parts of url

Valid name for parameter and wildcard parts are made of alphanumeric characters, and underscore(_). (regex: `[a-zA-Z0-9_]+`). The value of these parts can be accessed in controller via `req.params`.

## URL Resolution

For every incoming request, router will try to find the best matching route. If multiple routes match the url, the first registered route will be selected.

## Controller Types

The router supports two types of controllers:

1. **Functional Controllers**: Simple async functions
2. **Class Controllers**: Classes decorated with `@Controller`

### Functional Controllers

Basic format of a functional controller:

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  return { message: "GET regions" };
};
```

### Controller class

```ts
import { Controller, Get, Post, Put, Delete } from "@devbro/pashmak/router";
import { Request, Response } from "@devbro/pashmak/router";

@Controller("/api/v1/cats")
export class CatController {
  @Get("/", { middlewares: [logResponseMiddleware] })
  async getAllCats() {
    let req = ctx().get<Request>("request");
    let res = ctx().get<Response>("response");
    return { message: "GET all cats" };
  }

  @Post("/")
  async createCat() {
    let req = ctx().get<Request>("request");
    let res = ctx().get<Response>("response");
    return { message: "Cat created" };
  }

  @Put("/:id")
  async updateCat() {
    let req = ctx().get<Request>("request");
    let res = ctx().get<Response>("response");
    const { id } = req.params;
    return { message: `Cat ${id} updated` };
  }

  @Delete("/:id")
  async deleteCat() {
    let req = ctx().get<Request>("request");
    let res = ctx().get<Response>("response");
    const { id } = req.params;
    return { message: `Cat ${id} deleted` };
  }

  @Get(":id/logs")
  async getCatLogs() {
    let req = ctx().get<Request>("request");
    let res = ctx().get<Response>("response");
    const { id } = req.params;
    return { message: `Logs for cat ${id}` };
  }
}
```

### Direct Response Manipulation

For more complex responses, you can directly modify the Response object:

> **Note:** Response and Request objects are NOT the standard Node.js objects. Make sure to import them from `@devbro/pashmak/router`.

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  res.writeHead(418, { "Content-Type": "text/plain" });
  res.write("Can you guess what I am?");
};
```

## Accessing Request Data

```ts
async (req: Request, res: Response) => {
  const { id } = req.params; // URL parameters
  const { search } = req.query; // Query string parameters
  const data = req.body; // Request body
  const files = req.files; // Uploaded files

  return { id, search, data };
};
```

## Error Handling

The router handles errors automatically. If you throw an error of type `HttpError`, the HTTP server will render it as JSON. If the error is of any other type, the server will return a generic 500 error.

### Built-in HTTP Errors

```ts
import { Request, Response } from "@devbro/pashmak/router";
import {
  HttpError,
  HttpBadRequestError,
  HttpUnauthorizedError,
  HttpForbiddenError,
  HttpNotFoundError,
  HttpConflictError,
  HttpInternalServerError,
} from "@devbro/pashmak/http";

async (req: Request, res: Response) => {
  // Throw specific HTTP errors
  throw new HttpUnauthorizedError("Please login first");
  // or
  throw new HttpNotFoundError("Resource not found");
  // or
  throw new HttpBadRequestError("Invalid input");
};
```

### Custom Error Handler

You can set a custom error handler for more control:

```ts
import { httpServer } from "@devbro/pashmak/facades";
import { httpServer } from "@devbro/pashmak/http";

httpServer().setErrorHandler(async (err: Error, req: any, res: any) => {
  // Custom error handling logic
  if (err instanceof CustomError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "random error" }));
    return;
  }

  handleHttpErrors(err, req, res); // optional: call default handler
});
```

## Nesting Routers

There will be situations where we need to simplify your routers using prefix or having
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

### Handling null/undefined in response

When returning a json response, `undefined` is not considered a valid value.
As a work around, all values of `undefined` will be converted to `null` during
response.
