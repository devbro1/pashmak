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
import { HttpServer, handleHttpErrors } from "./http.mjs";
import * as yup from "yup";
import { Logger } from "@devbro/neko-logger";
import { CacheProviderFactory } from "./factories.mjs";
import { Cache } from "@devbro/neko-cache";
import { QueueConnection, QueueTransportFactory } from "@devbro/neko-queue";

/**
 * Wraps a singleton function with property accessors that delegate to the default instance.
 * This allows both `facade()` and `facade.method()` calling patterns.
 * @param singletonFn - The singleton function to wrap
 * @returns The wrapped singleton with property accessors
 */
function wrapSingletonWithAccessors<T>(
  singletonFn: (label?: string, ...args: any[]) => T,
): typeof singletonFn & Omit<T, keyof Function> {
  // Create a proxy that lazily adds method accessors on first access
  let methodsInitialized = false;

  const initializeMethods = () => {
    if (methodsInitialized) return;

    const defaultInstance = singletonFn();
    const prototype = Object.getPrototypeOf(defaultInstance);

    // Get all method names from the instance's prototype
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) =>
        name !== "constructor" &&
        typeof (prototype as any)[name] === "function",
    );

    // Attach each method as a property on the singleton function
    for (const methodName of methodNames) {
      (singletonFn as any)[methodName] = (...args: any[]) => {
        const instance = singletonFn();
        return (instance as any)[methodName](...args);
      };
    }

    methodsInitialized = true;
  };

  // Use a proxy to intercept property access and lazily initialize methods
  return new Proxy(singletonFn, {
    get(target, prop, receiver) {
      // If accessing a method that doesn't exist yet, initialize methods
      if (typeof prop === "string" && !Reflect.has(target, prop)) {
        initializeMethods();
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as typeof singletonFn & Omit<T, keyof Function>;
}

export const router = createSingleton<Router>(() => new Router());
export const scheduler = wrapSingletonWithAccessors(
  createSingleton<Scheduler>(() => {
    const rc = new Scheduler();
    rc.setErrorHandler((err: any, job: Schedule) => {
      logger().error({
        msg: "Scheduled job error",
        err,
        job_name: job.getName(),
      });
    });
    return rc;
  }),
);

export const db = (label = "default") =>
  ctx().getOrThrow<Connection>(["database", label]);

export const storage = wrapSingletonWithAccessors(
  createSingleton<Storage>((label: string = "default") => {
    let storage_config: any = config.get(["storages", label].join("."));

    const provider = StorageProviderFactory.create(
      storage_config.provider,
      storage_config.config,
    );

    return new Storage(provider);
  }),
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

  server.setErrorHandler(handleHttpErrors);
  server.setRouter(router());

  return server;
});

export const logger = wrapSingletonWithAccessors(
  createSingleton<Logger>((label) => {
    const logger_config: any = config.get(["loggers", label].join("."));
    const rc = new Logger(logger_config);
    rc.setExtrasFunction((message: any) => {
      message.requestId = ctxSafe()?.get("requestId") || "N/A";
      return message;
    });

    return rc;
  }),
);

export const mailer = wrapSingletonWithAccessors(
  createSingleton((label) => {
    const mailer_config: any = config.get(["mailer", label].join("."));

    const provider: MailerProvider = MailerProviderFactory.create(
      mailer_config.provider,
      mailer_config.config,
    );

    const rc = new Mailer(provider);
    return rc;
  }),
);

export const queue = wrapSingletonWithAccessors(
  createSingleton((label) => {
    const queue_config: any = config.get(["queues", label].join("."));
    if (!queue_config) {
      throw new Error(`Queue configuration for '${label}' not found`);
    }
    const provider = QueueTransportFactory.create(
      queue_config.provider,
      queue_config.config,
    );
    return new QueueConnection(provider);
  }),
);

export const cache = wrapSingletonWithAccessors(
  createSingleton((label) => {
    const cache_config: any = config.get(["caches", label].join("."));
    if (!cache_config) {
      throw new Error(`Cache configuration for '${label}' not found`);
    }
    const provider = CacheProviderFactory.create(
      cache_config.provider,
      cache_config.config,
    );

    return new Cache(provider);
  }),
);
