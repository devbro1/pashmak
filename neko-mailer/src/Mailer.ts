import { Mailable } from "Mailable";
import { MailerProvider } from "MailerProvider";

export class Mailer {
  constructor(private provider: MailerProvider) {}

  async send(mail: Mailable): Promise<void> {
    await this.provider.sendMail(mail);
  }
}
