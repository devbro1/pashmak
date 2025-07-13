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
  Put,
  Delete,
} from "@devbro/pashmak/router";

@Controller("/api/v1/users")
export class UserController extends BaseController {
  @Get()
  async list() {}

  @Post()
  async create() {}

  @Get({ path: "/:id" })
  async get(@Param("id") id: string) {}

  @Put({ path: "/:id" })
  async update(@Param("id") id: string) {}

  @Delete({ path: "/:id" })
  delete(@Param("id") id: string) {}
}
