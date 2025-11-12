import { FlexibleFactory } from "@devbro/neko-helper";
import { MailerProvider } from "./MailerProvider.mjs";

/**
 * Factory class for creating and registering mailer providers.
 * Uses a flexible factory pattern to manage different mailer provider implementations.
 */
export class MailerProviderFactory {
  /** The singleton factory instance */
  static instance: FlexibleFactory<MailerProvider> =
    new FlexibleFactory<MailerProvider>();

  /**
   * Registers a mailer provider factory function.
   * @template T - The provider type
   * @param key - Unique identifier for the provider
   * @param factory - Factory function that creates the provider instance
   */
  static register<T>(
    key: string,
    factory: (...args: any[]) => MailerProvider,
  ): void {
    MailerProviderFactory.instance.register(key, factory);
  }

  /**
   * Creates a mailer provider instance.
   * @template T - The provider type
   * @param key - The provider identifier
   * @param args - Arguments to pass to the provider factory
   * @returns A new mailer provider instance
   */
  static create<T>(key: string, ...args: any[]): MailerProvider {
    return MailerProviderFactory.instance.create(key, ...args);
  }
}
