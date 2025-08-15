import Mail from "nodemailer/lib/mailer";
import { Mailable } from "../Mailable.mts";
import { MailerProvider } from "../MailerProvider.mts";
import { prepareEmails } from "../helper.mts";

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
