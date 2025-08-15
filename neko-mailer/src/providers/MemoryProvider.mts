import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export class MemoryProvider implements MailerProvider {
  private defaultFrom: string = "";
  public sentEmails: {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    text: string;
    html: string;
  }[] = [];

  constructor() {}

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  async sendMail(mail: Mailable): Promise<void> {
    this.sentEmails.push({
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
