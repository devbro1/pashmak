import { Mailable } from "Mailable.mts";

export interface MailerProvider {
  setDefaultFrom(from: string): void;
  sendMail(mail: Mailable): Promise<void>;
}
