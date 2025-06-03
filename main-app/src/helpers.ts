import { ctx } from "neko-helper/src";
import { BaseModel } from "neko-orm/src";
import { Request } from "neko-router/src/types";
import { NotFound } from "http-errors";
import { createParamDecorator } from "neko-router/src/Controller";
import * as yup from "yup";
import * as jwt from "jsonwebtoken";
import config from "config";

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

export function ValidatedRequest(
  validationRules: yup.ObjectSchema<any>,
): ParameterDecorator {
  return createParamDecorator(async () => {
    const rc = await validationRules
      .noUnknown()
      .validate(ctx().get<Request>("request").body, { abortEarly: false });

    return rc;
  });
}

export function createJwtToken(data: any, token_params: jwt.SignOptions = {}) {
  let secret = config.get<string>("jwt.secret");
  token_params = config.get<jwt.SignOptions>("jwt.options");
  const token = jwt.sign(data, secret, { ...token_params, ...token_params });

  if (!token) {
    throw new Error("Unable to sign token !!");
  }
  return token;
}
