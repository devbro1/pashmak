---
sidebar_position: 4
---

# Router

The Router facade is the backbone of the HTTP server, connecting routes to your controllers and managing middleware.

## Basic Usage

```ts
import { Request, Response } from "@devbro/pashmak/router";
import { router } from "@devbro/pashmak/facades";
import { CatController } from "./app/controllers/CatController";
import { AnimalController } from "./app/controllers/AnimalController";
import { loggerMiddleware, logResponseMiddleware } from "./middlewares";

// Add global middleware (applies to all routes)
router().addGlobalMiddleware(loggerMiddleware);

// Add routes with functional controllers
router().addRoute(
  ["GET", "HEAD"],
  "/api/v1/countries",
  async (req: Request, res: Response) => {
    return { message: "GET countries" };
  }
);

// Single HTTP method
router().addRoute(
  ["GET"],
  "/api/v1/regions",
  async (req: Request, res: Response) => {
    return { message: "GET regions" };
  }
);

// Add route-specific middleware
router()
  .addRoute(
    ["GET"],
    "/api/v1/cities",
    async (req: Request, res: Response) => {
      return { message: "GET cities" };
    }
  )
  .addMiddleware(logResponseMiddleware);

// Register class-based controllers
router().addController(CatController);
router().addController(AnimalController);
```

## Controller Types

The router supports two types of controllers:

1. **Functional Controllers**: Simple async functions
2. **Class Controllers**: Classes decorated with `@Controller`

## Functional Controllers

Basic format of a functional controller:

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  return { message: "GET regions" };
};
```

### Direct Response Manipulation

For more complex responses, you can directly modify the Response object:

> **Note:** Response and Request objects are NOT the standard Node.js objects. Make sure to import them from `@devbro/pashmak/router`.

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  res.writeHead(418, { "Content-Type": "text/plain" });
  res.end("Can you guess what I am?");
};
```

### Accessing Request Data

```ts
async (req: Request, res: Response) => {
  const { id } = req.params;  // URL parameters
  const { search } = req.query;  // Query string parameters
  const data = req.body;  // Request body
  const files = req.files;  // Uploaded files
  
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
import { server } from "@devbro/pashmak/facades";

server().setErrorHandler(async (err: Error, req: any, res: any) => {
  // Custom error handling logic
  console.error(err);
  
  res.writeHead(500, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    error: "Internal Server Error",
    message: err.message,
  }));
});
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

### Handling null/undefined in response

When returning a json response, `undefined` is not considered a valid value.
As a work around, all values of `undefined` will be converted to `null` during
response.
