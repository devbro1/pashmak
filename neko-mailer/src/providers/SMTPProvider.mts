import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import nodemailer from "nodemailer";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the SMTPProvider.
 */
export type SMTPProviderOptions = {
  /** Nodemailer transport options for SMTP configuration */
  nodemailer_options: nodemailer.TransportOptions;
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that sends emails via SMTP using nodemailer.
 * Supports standard SMTP server configuration.
 */
export class SMTPProvider implements MailerProvider {
  private defaultFrom: string = "";
  private transporter;

  /**
   * Creates a new SMTPProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<SMTPProviderOptions> = {}) {
    this.transporter = nodemailer.createTransport(options.nodemailer_options);
    this.defaultFrom = options.default_from || "";
  }

  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  /**
   * Sends an email via SMTP.
   * @param mail - The email message to send
   */
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
