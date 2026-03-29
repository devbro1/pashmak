import * as yup from "yup";
import { z } from "zod";
import { ctx } from "@devbro/pashmak/context";
import { Request, createParamDecorator } from "@devbro/pashmak/router";

export function ValidatedRequest(
  validationRules:
    | yup.ObjectSchema<any>
    | (() => yup.ObjectSchema<any>)
    | z.ZodType<any>
    | (() => z.ZodType<any>),
): ParameterDecorator {
  return createParamDecorator(async () => {
    const schema =
      typeof validationRules === "function"
        ? validationRules()
        : validationRules;
    const requestBody = ctx().get<Request>("request").body;

    // Check if it's a Zod schema by checking for parse method
    if ("parse" in schema && typeof schema.parse === "function") {
      return await schema.parseAsync(requestBody);
    }

    // Otherwise, treat it as Yup schema
    const rc = await (schema as yup.ObjectSchema<any>)
      .noUnknown()
      .validate(requestBody, { abortEarly: false });

    return rc;
  });
}
