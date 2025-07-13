---
sidebar_position: 5
---

# Controller

Pashmak can accept both function and class controllers

# functional Controllers

# Class Controllers

```ts
import { db, storage, logger } from "@devbro/pashmak/facades";
import { ctx } from "@devbro/pashmak/context";
import {
  Request,
  Response,
  Model,
  Param,
  ValidatedRequest,
  BaseController,
  Controller,
  Get,
  Post,
} from "@devbro/pashmak/router";

@Controller("/api/v1/cats", {
  middlewares: [mid1, mid2],
})
export class CatController extends BaseController {
  @Get({ middlewares: [logResponseMiddleware] })
  async show() {
    const r = await db().runQuery({ sql: "select * from cats", bindings: [] });
    return {
      message: "GET cats",
      data: r,
    };
  }

  @Post()
  async store() {
    const req = ctx().get<Request>("request");
    logger().info({ msg: "request details", body: req.body, files: req.files });

    return "success";
  }

  @Put("/:id")
  async update(@Param("id") id) {
    return "success";
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
  showById(@Param("noteId") noteId: string, @Param("id") id: string) {
    return "notes";
  }
}
```

### order of middleware execution

the order is as followed:

1. middleswares defined in router as globalmiddlewares
2. middlewares defined at controller class
3. middlewares defined at each method
