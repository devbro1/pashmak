import { Mailable } from "Mailable.mjs";
import { MailerProvider } from "MailerProvider.mjs";
import { EventEmittor, EventManager } from "@devbro/neko-helper";

export const MailerEvents = ["sent", "failed"];
export type MailerEvent = (typeof MailerEvents)[number];

export class Mailer implements EventEmittor<["sent", "failed"]> {
  private eventManager = new EventManager<MailerEvent[]>();
  constructor(private provider: MailerProvider) {}

  on(event: MailerEvent, listener: (...args: any[]) => void): this {
    this.eventManager.on(event, listener);
    return this;
  }
  off(event: MailerEvent, listener: (...args: any[]) => void): this {
    this.eventManager.off(event, listener);
    return this;
  }
  async emit(event: MailerEvent, ...args: any[]): Promise<boolean> {
    return await this.eventManager.emit(event, ...args);
  }

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
