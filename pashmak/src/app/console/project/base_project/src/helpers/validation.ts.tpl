import { ctx } from '@devbro/pashmak/context';
import { Request, createParamDecorator } from '@devbro/pashmak/router';
{{#if (eq validation_library "yup")}}import * as yup from 'yup';{{/if}}{{#if (eq validation_library "zod")}}import { z } from 'zod';{{/if}}

export function ValidatedRequest(
  validationRules: {{#if (eq validation_library "yup")}} yup.ObjectSchema<any> | (() => yup.ObjectSchema<any>) {{/if}} {{#if (eq validation_library "zod")}} z.ZodType<any> | (() => z.ZodType<any>) {{/if}}
): ParameterDecorator {
  return createParamDecorator(async () => {
    const schema = typeof validationRules === "function" ? validationRules() : validationRules;
    const requestBody = ctx().get<Request>("request").body;


    {{#if (eq validation_library "zod")}}
    return await schema.parseAsync(requestBody);
    {{/if}}

    {{#if (eq validation_library "yup")}}
    // treat it as Yup schema
    const rc = await (schema as yup.ObjectSchema<any>)
      .noUnknown()
      .validate(requestBody, { abortEarly: false });

    return rc;
    {{/if}}
  });
}
