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

export function ApiDocumentation(
  open_api_url: string,
  renderer: "redoc" | "rapidoc" = "redoc",
) {
  if (renderer === "redoc") {
    return (req: Request, res: Response) => {
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
    };
  }

  if (renderer === "rapidoc") {
    return (req: Request, res: Response) => {
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
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
    <rapi-doc spec-url="${open_api_url}" theme="dark" render-style="read" show-header="false"></rapi-doc>
  </body>
</html>`;

      res.setHeader("Content-Type", "text/html");
      return html;
    };
  }
}
