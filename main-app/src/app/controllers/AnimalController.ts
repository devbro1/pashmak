import {
  BaseController,
  Controller,
  Get,
  Post,
} from "neko-router/src/Controller";
import { logResponseMiddleware } from "@root/middlewares";
import { db, storage } from "@root/facades";
import { ctx } from "neko-helper/src";
import { Request, Response } from "neko-router/src/types";
import fs from "fs";
import { Animal } from "../models/Animal";
import { Model, Param } from "@root/helpers";

@Controller("/api/v1/animals")
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
    console.log(req.body);
    console.log(req.files);
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
