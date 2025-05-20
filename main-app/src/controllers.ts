import { BaseController, Controller, GET } from "neko-router/src/Controller";
import { Param } from "neko-http/src/Param";

@Controller("/api/v1/cats")
export class CatController extends BaseController {
  @GET()
  show() {
    return {
      message: "GET cats",
    };
  }

  @GET("/:id/:id2")
  showById(@Param("id2") ss: string, @Param("id") id: string) {
    return {
      id,
      ss,
      name: "cat name",
    };
  }
}
