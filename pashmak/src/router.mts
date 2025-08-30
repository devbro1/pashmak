import { ctx } from "@devbro/neko-context";
import { BaseModel } from "@devbro/neko-orm";
import { Request } from "@devbro/neko-router";
import { HttpNotFoundError } from "@devbro/neko-http/errors";
import { createParamDecorator } from "@devbro/neko-router";
import * as yup from "yup";
export * from "@devbro/neko-router";

export function Model(
  model: typeof BaseModel,
  paramName: string,
): ParameterDecorator {
  return createParamDecorator(async () => {
    let rc = await model.find(ctx().get<Request>("request").params[paramName]);
    if (!rc) {
      throw new HttpNotFoundError("Object not found", "OBJECT_NOT_FOUND");
    }

    return rc;
  });
}

export function Param(paramName: string): ParameterDecorator {
  return createParamDecorator(() => {
    return ctx().get<Request>("request").params[paramName];
  });
}

export function ValidatedRequest(
  validationRules: yup.ObjectSchema<any> | (() => yup.ObjectSchema<any>),
): ParameterDecorator {
  return createParamDecorator(async () => {
    const rc = await (
      typeof validationRules === "function"
        ? validationRules()
        : validationRules
    )
      .noUnknown()
      .validate(ctx().get<Request>("request").body, { abortEarly: false });

    return rc;
  });
}
