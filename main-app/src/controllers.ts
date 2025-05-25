import {
  BaseController,
  Controller,
  Get,
  Post,
} from "neko-router/src/Controller";
import { Param } from "neko-router/src/Controller";
import { logResponseMiddleware } from "./middlewares";
import { db } from "./facades";
import { ctx } from "neko-http/src";

@Controller("/api/v1/cats")
export class CatController extends BaseController {
  @Get({ middlewares: [logResponseMiddleware] })
  async show() {
    let r = await db().runQuery({ sql: "select * from cats", bindings: [] });
    return {
      message: "GET cats",
      data: r,
    };
  }

  @Post()
  store() {
    let req = ctx().get<Request>("request");

    return req.body;
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
