import { Router } from "neko-router/src";
import { Scheduler } from "neko-scheduler/src";
import { createSingleton } from "neko-helper/src";
import { ctx } from "neko-helper/src";
import { Connection } from "neko-sql/src/Connection";
import { Storage, StorageFactory } from "neko-storage/src/";
import config from "config";
import { Command, Option, runExit, Cli } from "clipanion";
import { HttpServer } from "neko-http/src";
import { HttpError } from "http-errors";
import * as yup from "yup";

export const router = createSingleton<Router>(() => new Router());
export const scheduler = createSingleton<Scheduler>(() => new Scheduler());
export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);

export const storage = createSingleton<Storage>((label: string = "default") =>
  StorageFactory.create(config.get(["storages", label].join("."))),
);

export const cli = createSingleton<Cli>(() => {
  const [node, app, ...args] = process.argv;
  return new Cli({
    binaryLabel: `My Application`,
    binaryName: `${node} ${app}`,
    binaryVersion: `1.0.0`,
  });
});

export const httpServer = createSingleton<HttpServer>(() => {
  const server = new HttpServer();

  server.setErrorHandler(async (err: Error, req: any, res: any) => {
    if (err instanceof HttpError) {
      res.writeHead(err.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: err.message }));
      console.log("HttpError:", err.message);
      return;
    } else if (err instanceof yup.ValidationError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const errs: any = {};
      console.log(err);
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
      console.log("ValidationError:", err.message, errs);
      return;
    } else {
      console.error("non HttpError:", err);
    }
    res.writeHead(500, { "Content-Type": "" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  });
  server.setRouter(router());

  return server;
});
