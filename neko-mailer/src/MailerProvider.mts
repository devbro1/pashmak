import { Mailable } from "Mailable.mjs";

export interface MailerProvider {
  setDefaultFrom(from: string): void;
  sendMail(mail: Mailable): Promise<void>;
}
