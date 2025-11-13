---
sidebar_position: 5
---

# Controller

Pashmak can accept both function and class controllers.

## Functional Controllers

Functional controllers are simple async functions that receive request and response objects:

```ts
import { Request, Response } from "@devbro/pashmak/router";
import { router } from "@devbro/pashmak/facades";

router().addRoute(
  ["GET"],
  "/api/v1/hello",
  async (req: Request, res: Response) => {
    return { message: "Hello World" };
  }
);
```

For more complex responses, you can directly modify the Response object:

```ts
import { Request, Response } from "@devbro/pashmak/router";

async (req: Request, res: Response) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Custom response" }));
};
```

## Class Controllers

Class controllers provide a cleaner way to organize your routes using decorators:

```ts
import { db, storage, logger } from "@devbro/pashmak/facades";
import { ctx } from "@devbro/pashmak/context";
import {
  Request,
  Response,
  Model,
  Param,
  BaseController,
  Controller,
  Get,
  Post,
  Put,
  Delete,
} from "@devbro/pashmak/router";

@Controller("/api/v1/cats", {
  middlewares: [mid1, mid2],
})
export class CatController extends BaseController {
  @Get({ middlewares: [logResponseMiddleware] })
  async list() {
    const r = await db().runQuery({
      sql: "select * from cats",
      parts: [],
      bindings: [],
    });
    return {
      message: "GET cats",
      data: r,
    };
  }

  @Post()
  async store() {
    const req = ctx().get<Request>("request");
    logger().info({ msg: "request details", body: req.body, files: req.files });

    return { success: true };
  }

  @Get({ path: "/:id" })
  async show(@Param("id") id: string) {
    return { id, name: "cat name" };
  }

  @Put({ path: "/:id" })
  async update(@Param("id") id: string, @Model(CatModel, "id", "id") cat: CatModel) {
    // Model decorator automatically fetches the cat by id
    cat.name = "Updated name";
    await cat.save();
    return cat;
  }

  @Delete({ path: "/:id" })
  async delete(@Param("id") id: string) {
    await CatModel.deleteById(id);
    return { success: true };
  }

  @Get({ path: "/file" })
  async getFile() {
    const res = ctx().get<Response>("response");
    await res.writeHead(200, {
      "Content-Type": "image/jpeg",
    });

    (await storage().getStream("test.jpg")).pipe(res);
  }

  @Get({ path: "/file-details" })
  async getFileDetails() {
    return await storage().metadata("test.jpg");
  }

  @Get({ path: "/:id/notes/:noteId" })
  showNotes(@Param("noteId") noteId: string, @Param("id") id: string) {
    return { id, noteId, notes: [] };
  }
}
```

## Controller Decorators

### HTTP Method Decorators

- `@Get(options?)` - Handle GET requests
- `@Post(options?)` - Handle POST requests
- `@Put(options?)` - Handle PUT requests
- `@Delete(options?)` - Handle DELETE requests
- `@Patch(options?)` - Handle PATCH requests

Each decorator accepts an optional configuration object:

```ts
@Get({
  path: "/:id",  // Route path (optional, defaults to "/")
  middlewares: [middleware1, middleware2]  // Route-specific middlewares
})
```

### Parameter Decorators

#### @Param(param_name)

Extracts a specific parameter from the request URL and injects it into the controller method:

```ts
@Get({ path: "/:id" })
async show(@Param("id") id: string) {
  // id contains the value from the URL parameter
  return { id };
}
```

#### @Model(ModelClass, param_name?, model_field?)

Automatically fetches a model instance based on a route parameter and injects it into the controller method:

- `ModelClass` - The ORM model class to fetch
- `param_name` - Optional, defaults to "id". The parameter name in the URL.
- `model_field` - Optional, defaults to "id". The field in the model to match against the param value.

```ts
@Put({ path: "/:id" })
async update(@Param("id") id: string, @Model(User) user: User) {
  // user is automatically fetched from database
  user.name = "Updated";
  await user.save();
  return user;
}
```

#### @ValidatedRequest(validation_schema)

Validates the incoming request data against a defined schema and injects the validated data into the controller. See the [Validation](/docs/going-deeper/validation) page for more details.

```ts
import * as yup from "yup";

const createUserSchema = yup.object({
  name: yup.string().required(),
  email: yup.string().email().required(),
});

@Post()
async create(@ValidatedRequest(createUserSchema) data: any) {
  // data is validated and type-safe
  return await User.create(data);
}
```

## Registering Controllers

To use a controller, register it with the router:

```ts
import { router } from "@devbro/pashmak/facades";
import { CatController } from "./app/controllers/CatController";

router().addController(CatController);
```

## Middleware Execution Order

Middlewares are executed in the following order:

1. Global middlewares defined in router
2. Middlewares defined at controller class level
3. Middlewares defined at individual method level

```ts
import { router } from "@devbro/pashmak/facades";

// 1. Global middleware (runs first)
router().addGlobalMiddleware(authMiddleware);

// 2. Controller-level middleware (runs second)
@Controller("/api/v1/users", {
  middlewares: [checkPermissions]
})
export class UserController extends BaseController {
  // 3. Method-level middleware (runs last)
  @Get({ middlewares: [logRequest] })
  async list() {
    return [];
  }
}
```
