import {
  BaseController,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Request,
} from "@devbro/pashmak/router";
import { ctx } from "@devbro/pashmak/context";
import { {{className}}Service } from "@/app/features/{{classNameLower}}/{{className}}Service";

@Controller("/api/v1/{{routeName}}")
export class {{className}}Controller extends BaseController {
  private service = new {{className}}Service();

  @Get()
  async list() {
    const params = ctx().get<Request>('request').query!;
    return await this.service.list(params);
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
