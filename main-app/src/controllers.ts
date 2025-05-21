import { BaseController, Controller, Get } from "neko-router/src/Controller";
import { Param } from "neko-router/src/Controller";

@Controller("/api/v1/cats")
export class CatController extends BaseController {
  @Get()
  show() {
    return {
      message: "GET cats",
    };
  }

  @Get("/:id/:id2")
  showById(@Param("id2") ss: string, @Param("id") id: string) {
    return {
      id,
      ss,
      name: "cat name",
    };
  }
}
