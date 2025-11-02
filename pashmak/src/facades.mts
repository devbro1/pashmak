import { Router } from "./router.mjs";
import { Schedule, Scheduler } from "@devbro/neko-scheduler";
import { createSingleton } from "@devbro/neko-helper";
import { ctx, ctxSafe } from "@devbro/neko-context";
import { Connection } from "@devbro/neko-sql";
import { Storage, StorageProviderFactory } from "@devbro/neko-storage";
import {
  Mailer,
  MailerProvider,
  MailerProviderFactory,
} from "@devbro/neko-mailer";
import { config } from "@devbro/neko-config";
import { Cli } from "clipanion";
import { HttpServer, HttpError } from "./http.mjs";
import * as yup from "yup";
import { Logger } from "@devbro/neko-logger";
import { CacheProviderFactory } from "./factories.mjs";
import { Cache } from "@devbro/neko-cache";
import { QueueConnection, QueueTransportFactory } from "@devbro/neko-queue";

export const router = createSingleton<Router>(() => new Router());
export const scheduler = createSingleton<Scheduler>(() => {
  const rc = new Scheduler();
  rc.setErrorHandler((err: any, job: Schedule) => {
    logger().error({
      msg: "Scheduled job error",
      err,
      job_name: job.getName(),
    });
  });
  return rc;
});
export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);

export const storage = createSingleton<Storage>((label: string = "default") => {
  let storage_config: any = config.get(["storages", label].join("."));

  const provider = StorageProviderFactory.create(
    storage_config.provider,
    storage_config.config,
  );

  return new Storage(provider);
});

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
      res.end(JSON.stringify({ message: err.message, error: err.code }));
      logger().warn({ msg: "HttpError: " + err.message, err });
      return;
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
    } else {
      logger().error({ msg: "Error: " + err.message, err });
    }
    res.writeHead(500, { "Content-Type": "" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  });
  server.setRouter(router());

  return server;
});

export const logger = createSingleton<Logger>((label) => {
  const logger_config: any = config.get(["loggers", label].join("."));
  const rc = new Logger(logger_config);
  rc.setExtrasFunction((message: any) => {
    message.requestId = ctxSafe()?.get("requestId") || "N/A";
    return message;
  });

  return rc;
});

export const mailer = createSingleton((label) => {
  const mailer_config: any = config.get(["mailer", label].join("."));

  const provider: MailerProvider = MailerProviderFactory.create(
    mailer_config.provider,
    mailer_config.config,
  );

  const rc = new Mailer(provider);
  return rc;
});

export const queue = createSingleton((label) => {
  const queue_config: any = config.get(["queues", label].join("."));
  if (!queue_config) {
    throw new Error(`Queue configuration for '${label}' not found`);
  }
  const provider = QueueTransportFactory.create(
    queue_config.provider,
    queue_config.config,
  );
  const rc = new QueueConnection(provider);
  return rc;
});

export const cache = createSingleton((label) => {
  const cache_config: any = config.get(["caches", label].join("."));
  if (!cache_config) {
    throw new Error(`Cache configuration for '${label}' not found`);
  }
  const provider = CacheProviderFactory.create(
    cache_config.provider,
    cache_config.config,
  );

  return new Cache(provider);
});
