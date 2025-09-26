import { ctx } from "@devbro/neko-context";
import { BaseModel } from "@devbro/neko-orm";
import { Request } from "@devbro/neko-router";
import { HttpNotFoundError } from "@devbro/neko-http/errors";
import { createParamDecorator } from "@devbro/neko-router";
import * as yup from "yup";
export * from "@devbro/neko-router";

export function Model(
  model: typeof BaseModel,
  param_name: string = "id",
  model_field: string = "id",
): ParameterDecorator {
  return createParamDecorator(async () => {
    let rc = await model.findOne({
      [model_field]: ctx().get<Request>("request").params[param_name],
    });
    if (!rc) {
      throw new HttpNotFoundError("Object not found", "OBJECT_NOT_FOUND");
    }

    return rc;
  });
}

export function Param(param_name: string): ParameterDecorator {
  return createParamDecorator(() => {
    return ctx().get<Request>("request").params[param_name] || undefined;
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
