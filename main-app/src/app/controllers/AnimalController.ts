import { authenticate, logResponseMiddleware } from "../../middlewares";
import { db, storage, logger } from "@devbro/pashmak/facades";
import { ctx } from "@devbro/pashmak/context";
import { Animal } from "../models/Animal";
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

@Controller("/api/v1/animals", { middlewares: [authenticate] })
export class AnimalController extends BaseController {
  @Get({ middlewares: [logResponseMiddleware] })
  async show() {
    const r = await db().runQuery({
      sql: "select * from animals",
      bindings: [],
    });
    return {
      message: "GET animals",
      data: r,
    };
  }

  @Post()
  async store() {
    const req = ctx().get<Request>("request");
    logger().info({ msg: "request details", body: req.body, files: req.files });
    const animal = new Animal();
    animal.fill(req.body);
    await animal.save();

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

  @Get({ path: "/:id" })
  async showById(@Param("id") id: number, @Model(Animal, "id") mm: Animal) {
    return { mm, id };
  }
}
