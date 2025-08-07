import { db, storage, logger } from "@devbro/pashmak/facades";
import { ctx } from "@devbro/pashmak/context";
import { Request, Response, Model, Param, ValidatedRequest, BaseController, Controller, Get, Post, Put, Delete } from "@devbro/pashmak/router";


const {{classNameLower}}Validation = yup.object({
  name: yup.string().required().min(2).max(255),
  active: yup.boolean().required().default(true),
});
type {{className}}ValidationType = yup.InferType<typeof {{classNameLower}}Validation>;

@Controller("/api/v1/{{routeName}}")
export class {{className}}Controller extends BaseController {
  @Get()
  async list() {

  }

  @Post()
  async create(@ValidatedRequest({{classNameLower}}Validation) body: {{className}}ValidationType) {

  }

  @Get({ path: "/:id" })
  async get(@Param("id") id: string, @Model({{className}}, 'id') {{classNameLower}}: {{className}}) {

    return {{classNameLower}};
  }

  @Put({ path: "/:id" })
  async update(
    @Model({{className}}, 'id') dealer: Dealer,
    @ValidatedRequest({{classNameLower}}Validation) body: {{className}}ValidationType
  ) {

  }

  @Delete({ path: "/:id" })
  delete(@Param("id") id: string) {
  }
}
