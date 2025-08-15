import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export class FunctionProvider implements MailerProvider {
  private defaultFrom: string = "";

  constructor(private func: Function) {}

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  async sendMail(mail: Mailable): Promise<void> {
    mail.to = prepareEmails(mail.to);
    mail.cc = prepareEmails(mail.cc);
    mail.bcc = prepareEmails(mail.bcc);
    mail.from = mail.from || this.defaultFrom;

    await this.func(mail);
  }
}
