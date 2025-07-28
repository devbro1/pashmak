import { Mailable } from "Mailable";

export interface MailerProvider {
  setDefaultFrom(from: string): void;
  sendMail(mail: Mailable): Promise<void>;
}
