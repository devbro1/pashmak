import { FlexibleFactory } from "@devbro/neko-helper";
import { MailerProvider } from "./MailerProvider.mjs";

export class MailerProviderFactory {
  static instance: FlexibleFactory<MailerProvider> =
    new FlexibleFactory<MailerProvider>();

  static register<T>(
    key: string,
    factory: (...args: any[]) => MailerProvider,
  ): void {
    MailerProviderFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): MailerProvider {
    return MailerProviderFactory.instance.create(key, ...args);
  }
}
