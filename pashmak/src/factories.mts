import {
  Mailer,
  Mailable,
  MailerProvider,
  FunctionProvider,
  SESProvider,
  SMTPProvider,
  MemoryProvider,
} from "@devbro/neko-mailer";
import { logger } from "./facades.mjs";
import { QueueConnection } from "@devbro/neko-queue";
import { MemoryTransport } from "@devbro/neko-queue";
import { DatabaseTransport } from "./queue.mjs";

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
    return new ctor(...args);
  }
}

export class MailerFactory {
  static instance: FlexibleFactory<MailerProvider> =
    new FlexibleFactory<MailerProvider>();

  static register<T>(
    key: string,
    factory: (...args: any[]) => MailerProvider,
  ): void {
    MailerFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): MailerProvider {
    return MailerFactory.instance.create(key, ...args);
  }
}

MailerFactory.register("logger", (opt) => {
  return new FunctionProvider((mail: Mailable) => {
    logger().info({
      msg: "Sending email",
      mail,
    });
  });
});

MailerFactory.register("SES", (opt) => {
  return new SESProvider(opt);
});

MailerFactory.register("SMTP", (opt) => {
  return new SMTPProvider(opt);
});

MailerFactory.register("MEMORY", (opt) => {
  return new MemoryProvider();
});

export class QueueFactory {
  static instance: FlexibleFactory<QueueConnection<any>> = new FlexibleFactory<
    QueueConnection<any>
  >();

  static register<T>(key: string, factory: (...args: any[]) => T): void {
    QueueFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): QueueConnection<any> {
    return QueueFactory.instance.create(key, ...args);
  }
}

QueueFactory.register("database", (opt) => {
  let transport = new DatabaseTransport(opt);
  return new QueueConnection(transport);
});

QueueFactory.register("memory", (opt) => {
  let transport = new MemoryTransport(opt);
  return new QueueConnection(transport);
});
