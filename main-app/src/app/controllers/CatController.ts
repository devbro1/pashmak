import { BaseController, Controller, Get, Post } from "neko-router";
import { Param } from "@root/helpers";
import { logResponseMiddleware } from "@root/middlewares";
import { db, storage, logger } from "@root/facades";
import { ctx } from "neko-helper";
import { Request, Response } from "neko-router";
import fs from "fs";

@Controller("/api/v1/cats")
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

    await storage().put(
      req.files.f1.newFilename,
      fs.readFileSync(req.files.f1.filepath),
    );
    return req.body;
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

  @Get({ path: "/:id/:id2" })
  showById(@Param("id2") ss: string, @Param("id") id: string) {
    return {
      id,
      ss,
      name: "cat name",
    };
  }
}
