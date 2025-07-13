import {
  BaseController,
  Controller,
  Get,
} from "@devbro/pashmak/router";

@Controller("/api/v1/hello", { middlewares: [] })
export class HelloController extends BaseController {
  @Get({ middlewares: [] })
  async show() {
    
    return {
      message: "Hello world!",
    };
  }
}
