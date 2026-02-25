import {
  SESProvider,
  SMTPProvider,
  MemoryProvider,
  MailerProviderFactory,
} from "@devbro/neko-mailer";
import {
  MemoryTransport,
  QueueTransportFactory,
  AwsSqsTransport,
  AmqpTransport,
  RedisTransport,
  AsyncTransport,
  AzureServiceBusTransport,
  GooglePubSubTransport,
} from "@devbro/neko-queue";
import { DatabaseTransport } from "./queue.mjs";
import {
  CacheProviderInterface,
  MemoryCacheProvider,
  RedisCacheProvider,
  FileCacheProvider,
  DisabledCacheProvider,
  MultiCacheProvider,
} from "@devbro/neko-cache";
import {
  AWSS3StorageProvider,
  LocalStorageProvider,
  StorageProviderFactory,
  GCPStorageProvider,
  AzureBlobStorageProvider,
  FTPStorageProvider,
  SFTPStorageProvider,
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

MailerProviderFactory.register("ses", (opt) => {
  return new SESProvider(opt);
});

MailerProviderFactory.register("smtp", (opt) => {
  return new SMTPProvider(opt);
});

MailerProviderFactory.register("memory", (opt) => {
  return new MemoryProvider();
});

// Queue

QueueTransportFactory.register("database", (opt) => {
  return new DatabaseTransport(opt);
});

QueueTransportFactory.register("memory", (opt) => {
  return new MemoryTransport(opt);
});

QueueTransportFactory.register("sqs", (opt) => {
  return new AwsSqsTransport(opt);
});

QueueTransportFactory.register("amqp", (opt) => {
  return new AmqpTransport(opt);
});

QueueTransportFactory.register("redis", (opt) => {
  return new RedisTransport(opt);
});

QueueTransportFactory.register("async", (opt) => {
  return new AsyncTransport();
});

QueueTransportFactory.register("azure_service_bus", (opt) => {
  return new AzureServiceBusTransport(opt);
});

QueueTransportFactory.register("google_pubsub", (opt) => {
  return new GooglePubSubTransport(opt);
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

CacheProviderFactory.register("multi", (opt) => {
  return new MultiCacheProvider(opt);
});

StorageProviderFactory.register("local", (opt) => {
  return new LocalStorageProvider(opt);
});

StorageProviderFactory.register("s3", (opt) => {
  return new AWSS3StorageProvider(opt);
});

StorageProviderFactory.register("gcp", (opt) => {
  return new GCPStorageProvider(opt);
});

StorageProviderFactory.register("azure", (opt) => {
  return new AzureBlobStorageProvider(opt);
});

StorageProviderFactory.register("ftp", (opt) => {
  return new FTPStorageProvider(opt);
});

StorageProviderFactory.register("sftp", (opt) => {
  return new SFTPStorageProvider(opt);
});
