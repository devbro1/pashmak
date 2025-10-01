import {
  Mailer,
  Mailable,
  MailerProvider,
  FunctionProvider,
  SESProvider,
  SMTPProvider,
  MemoryProvider,
  MailerProviderFactory,
} from "@devbro/neko-mailer";
import { logger } from "./facades.mjs";
import { QueueConnection, QueueTransportInterface } from "@devbro/neko-queue";
import { MemoryTransport, QueueTransportFactory } from "@devbro/neko-queue";
import { DatabaseTransport } from "./queue.mjs";
import {
  CacheProviderInterface,
  MemoryCacheProvider,
  RedisCacheProvider,
  FileCacheProvider,
  DisabledCacheProvider,
} from "@devbro/neko-cache";
import {
  AWSS3StorageProvider,
  LocalStorageProvider,
  StorageProviderFactory,
} from "@devbro/neko-storage";

export class FlexibleFactory<T> {
  registry: Map<string, any> = new Map();

  register<T>(key: string, ctor: (...args: any[]) => T) {
    this.registry.set(key, ctor);
  }

  create<T>(key: string, ...args: any[]): T {
    const ctor = this.registry.get(key);
    if (!ctor) {
      throw new Error(`No factory registered for key: ${key}`);
    }
    return ctor(...args);
  }
}

MailerProviderFactory.register("logger", (opt) => {
  return new FunctionProvider((mail: Mailable) => {
    logger().info({
      msg: "Sending email",
      mail,
    });
  });
});

MailerProviderFactory.register("ses", (opt) => {
  return new SESProvider(opt);
});

MailerProviderFactory.register("smtp", (opt) => {
  return new SMTPProvider(opt);
});

MailerProviderFactory.register("memory", (opt) => {
  return new MemoryProvider();
});

QueueTransportFactory.register("database", (opt) => {
  let transport = new DatabaseTransport(opt);
  return new QueueConnection(transport);
});

QueueTransportFactory.register("memory", (opt) => {
  let transport = new MemoryTransport(opt);
  return new QueueConnection(transport);
});

// CACHE
export class CacheProviderFactory {
  static instance: FlexibleFactory<CacheProviderInterface> =
    new FlexibleFactory<CacheProviderInterface>();

  static register(
    key: string,
    factory: (...args: any[]) => CacheProviderInterface,
  ): void {
    CacheProviderFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): CacheProviderInterface {
    return CacheProviderFactory.instance.create(key, ...args);
  }
}

CacheProviderFactory.register("memory", (opt) => {
  return new MemoryCacheProvider(opt);
});

CacheProviderFactory.register("redis", (opt) => {
  return new RedisCacheProvider(opt);
});

CacheProviderFactory.register("file", (opt) => {
  return new FileCacheProvider(opt);
});

CacheProviderFactory.register("disabled", (opt) => {
  return new DisabledCacheProvider();
});

StorageProviderFactory.register("local", (opt) => {
  return new LocalStorageProvider(opt);
});

StorageProviderFactory.register("s3", (opt) => {
  return new AWSS3StorageProvider(opt);
});
