import { Mailable } from "Mailable.mts";
import { MailerProvider } from "MailerProvider.mts";

export class Mailer {
  constructor(private provider: MailerProvider) {}

  async send(mail: Mailable): Promise<void> {
    await this.provider.sendMail(mail);
  }
}
