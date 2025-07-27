import { Mailable } from "../Mailable";
import { MailerProvider } from "../MailerProvider";
import nodemailer from "nodemailer";
import { prepareEmails } from "../helper";

export class SMTPProvider implements MailerProvider {
  private defaultFrom: string = "";
  private transporter;

  constructor(options: nodemailer.TransportOptions = {}) {
    this.transporter = nodemailer.createTransport(options);
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
