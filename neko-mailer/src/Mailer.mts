import { Mailable } from "Mailable.mjs";
import { MailerProvider } from "MailerProvider.mjs";
import { EventEmittor, EventManager } from "@devbro/neko-helper";

/** Available mailer events */
export const MailerEvents = ["sent", "failed"];
/** Type representing mailer events */
export type MailerEvent = (typeof MailerEvents)[number];

/**
 * Main mailer class for sending emails with event support.
 * Provides a unified interface for sending emails through various providers
 * with event notifications for sent and failed emails.
 */
export class Mailer implements EventEmittor<["sent", "failed"]> {
  private eventManager = new EventManager<MailerEvent[]>();

  /**
   * Creates a new Mailer instance.
   * @param provider - The mailer provider to use for sending emails
   */
  constructor(private provider: MailerProvider) {}

  /**
   * Registers an event listener.
   * @param event - The event to listen for ('sent' or 'failed')
   * @param listener - The callback function to execute when the event occurs
   * @returns This mailer instance for chaining
   */
  on(event: MailerEvent, listener: (...args: any[]) => void): this {
    this.eventManager.on(event, listener);
    return this;
  }

  /**
   * Removes an event listener.
   * @param event - The event to stop listening for
   * @param listener - The callback function to remove
   * @returns This mailer instance for chaining
   */
  off(event: MailerEvent, listener: (...args: any[]) => void): this {
    this.eventManager.off(event, listener);
    return this;
  }

  /**
   * Emits an event to all registered listeners.
   * @param event - The event to emit
   * @param args - Arguments to pass to the listeners
   * @returns True if the event was emitted successfully
   */
  async emit(event: MailerEvent, ...args: any[]): Promise<boolean> {
    return await this.eventManager.emit(event, ...args);
  }

  /**
   * Sends an email message.
   * Emits 'sent' event on success or 'failed' event on error.
   * @param mail - The email message to send
   * @throws The error from the provider if sending fails
   */
  async send(mail: Mailable): Promise<void> {
    try {
      await this.provider.sendMail(mail);
      await this.eventManager.emit("sent", { mail });
    } catch (error) {
      await this.eventManager.emit("failed", { mail, error });
      throw error;
    }
  }
}
