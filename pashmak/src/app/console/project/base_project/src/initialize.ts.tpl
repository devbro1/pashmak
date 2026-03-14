import dotenv from "dotenv";
dotenv.config();

import { config, loadConfigData } from "@devbro/pashmak/config";
import * as config_data from "./config/default.mts";
await config.load(loadConfigData(config_data));

import { httpServer, logger } from "@devbro/pashmak/facades";
import { startQueueListeners } from "@/app/queues";
import { HttpError } from "@devbro/pashmak/http";

import * as yup from "yup";
import { Request, Response, Middleware } from "@devbro/neko-router";
import { DatabaseProviderMiddleware } from "@devbro/pashmak/middlewares";

import "@devbro/pashmak";

import "./app/console";
import "./routes";
import "./schedules";

import { context_provider } from "@devbro/neko-context";

import { Connection } from "@devbro/neko-sql";
import { Global } from "@devbro/pashmak/global";
import { ctx } from "@devbro/pashmak/context";
import { BaseModel } from "@devbro/pashmak/orm";

context_provider.setPreLoader(async (f: Function) => {
	const middlewares: Middleware[] = [];
	const m = DatabaseProviderMiddleware.getInstance();
	middlewares.push(m);

	await m.call({} as Request, {} as Response, f as () => Promise<void>);
});

Global.set(
	"database.default",
	DatabaseProviderMiddleware.getInstance().getConnection(
		config.get("databases.default") as any,
	),
);

BaseModel.setConnection(() => {
	const key = ["database", "default"];
	let rc: Connection | undefined;

	if (ctx.isActive()) {
		rc = ctx().get<Connection>(key);
	} else if (Global.has(key)) {
		rc = Global.get<Connection>(key);
	}
	return rc!;
});

httpServer().setErrorHandler(async (err: Error, req: any, res: any) => {
    if (err instanceof HttpError) {
      res.writeHead(err.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: err.message, error: err.code }));
      logger().warn({ msg: "HttpError: " + err.message, err });
      return;
    {{#if (eq validation_library "zod")}}
    } else if (err instanceof ZodError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const { errors } = z.treeifyError(err);

      res.end(JSON.stringify({ message: "validation error", errors: errors }));
      logger().warn({ msg: "ZodError: " + err.message, err });
      return;
    {{/if}}
    {{#if (eq validation_library "yup")}}
    } else if (err instanceof yup.ValidationError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const errs: any = {};
      err.inner.forEach((e: yup.ValidationError) => {
        // Sanitize sensitive fields
        const sanitizedParams = { ...e.params };
        if (/passw/i.test(e.path!)) {
          sanitizedParams.value = "******";
          sanitizedParams.originalValue = "******";
        }

        errs[e.path!] = {
          type: e.type,
          message: e.message,
          params: sanitizedParams,
        };
      });

      res.end(JSON.stringify({ message: "validation error", errors: errs }));
      logger().warn({ msg: "ValidationError: " + err.message, err });
      return;
    {{/if}}
    } else {
      logger().error({ msg: "Error: " + err.message, err });
    }
    res.writeHead(500, { "Content-Type": "" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  });

startQueueListeners();
