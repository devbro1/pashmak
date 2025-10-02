import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import nodemailer from "nodemailer";
import { prepareEmails } from "../helper.mjs";

export type SMTPProviderOptions = {
  nodemailer_options: nodemailer.TransportOptions;
  default_from: string;
};
export class SMTPProvider implements MailerProvider {
  private defaultFrom: string = "";
  private transporter;

  constructor(options: Partial<SMTPProviderOptions> = {}) {
    this.transporter = nodemailer.createTransport(options.nodemailer_options);
    this.defaultFrom = options.default_from || "";
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  async sendMail(mail: Mailable): Promise<void> {
    await this.transporter.sendMail({
      from: mail.from || this.defaultFrom,
      to: prepareEmails(mail.to),
      cc: prepareEmails(mail.cc),
      bcc: prepareEmails(mail.bcc),
      subject: mail.subject,
      text: await mail.getTextContent(),
      html: await mail.getHtmlContent(),
    });
  }
}
