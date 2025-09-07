import { Mailable } from "Mailable.mts";
import { MailerProvider } from "MailerProvider.mjs";
import { EventEmittorBase } from "@devbro/neko-helper";

export const MailerEvents = ["sent", "failed"];
export type MailerEvent = (typeof MailerEvents)[number];

export class Mailer extends EventEmittorBase<["sent", "failed"]> {
  constructor(private provider: MailerProvider) {
    super();
  }

  async send(mail: Mailable): Promise<void> {
    try {
      await this.provider.sendMail(mail);
      await this.emit("sent", { mail });
    } catch (error) {
      await this.emit("failed", { mail, error });
      throw error;
    }
  }
}
