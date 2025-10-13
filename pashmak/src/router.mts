import { ctx } from "@devbro/neko-context";
import { BaseModel } from "@devbro/neko-orm";
import { Request, Response } from "@devbro/neko-router";
import { HttpNotFoundError } from "@devbro/neko-http/errors";
import { createParamDecorator } from "@devbro/neko-router";
import * as yup from "yup";
import { config } from "@devbro/neko-config";
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

export function ApiDocumentation(req: Request, res: Response) {
  let open_api_url: string = config.get("api_doc_url");
  let html = `<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">

    <!--
    Redoc doesn't change outer page styles
    -->
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='${open_api_url}'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return html;
}
