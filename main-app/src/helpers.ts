import { ctx } from "neko-helper/src";
import { BaseModel } from "neko-orm/src";
import { Request } from "neko-router/src/types";
import { NotFound } from "http-errors";
import { createParamDecorator } from "neko-router/src/Controller";

export function Model(
  model: typeof BaseModel,
  paramName: string,
): ParameterDecorator {
  return createParamDecorator(async () => {
    let rc = await model.find(ctx().get<Request>("request").params[paramName]);
    if (!rc) {
      throw new NotFound("Object not found");
    }

    return rc;
  });
}

export function Param(paramName: string): ParameterDecorator {
  return createParamDecorator(() => {
    return ctx().get<Request>("request").params[paramName];
  });
}
