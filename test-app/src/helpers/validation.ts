import { ctx } from "@devbro/pashmak/context";
import { Request, createParamDecorator } from "@devbro/pashmak/router";
import * as yup from "yup";

export function ValidatedRequest(
  validationRules: yup.ObjectSchema<any> | (() => yup.ObjectSchema<any>),
): ParameterDecorator {
  return createParamDecorator(async () => {
    const schema =
      typeof validationRules === "function"
        ? validationRules()
        : validationRules;
    const requestBody = ctx().get<Request>("request").body;

    // treat it as Yup schema
    const rc = await (schema as yup.ObjectSchema<any>)
      .noUnknown()
      .validate(requestBody, { abortEarly: false });

    return rc;
  });
}
