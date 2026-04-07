import {
  BaseController,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
} from "@devbro/pashmak/router";
import { {{className}}Service } from "./{{className}}Service";

@Controller("/api/v1/{{routeName}}")
export class {{className}}Controller extends BaseController {
  private service = new {{className}}Service();

  @Get()
  async list() {
    return await this.service.list();
  }

  @Post()
  async create() {
    return await this.service.create({});
  }

  @Get({ path: "/:id" })
  async get(@Param("id") id: string) {
    return await this.service.findById(id);
  }

  @Put({ path: "/:id" })
  async update(@Param("id") id: string) {
    return await this.service.update(id, {});
  }

  @Delete({ path: "/:id" })
  async delete(@Param("id") id: string) {
    return await this.service.delete(id);
  }
}
