import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import nodemailer from "nodemailer";
import { prepareEmails } from "../helper.mjs";

export type ProtonMailProviderOptions = {
  bridge_host?: string;
  bridge_port?: number;
  username: string;
  password: string;
  default_from: string;
  reject_unauthorized?: boolean; // Whether to verify SSL certificates (default: false for Bridge)
};

/**
 * ProtonMail provider using ProtonMail Bridge for SMTP
 * Requires ProtonMail Bridge to be installed and running
 * https://proton.me/mail/bridge
 */
export class ProtonMailProvider implements MailerProvider {
  private defaultFrom: string = "";
  private transporter;

  constructor(options: Partial<ProtonMailProviderOptions> = {}) {
    this.defaultFrom = options.default_from || "";

    // ProtonMail Bridge default settings
    const host =
      options.bridge_host || process.env.PROTONMAIL_BRIDGE_HOST || "127.0.0.1";
    const port =
      options.bridge_port ||
      parseInt(process.env.PROTONMAIL_BRIDGE_PORT || "1025");
    const username = options.username || process.env.PROTONMAIL_USERNAME || "";
    const password = options.password || process.env.PROTONMAIL_PASSWORD || "";

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // ProtonMail Bridge uses STARTTLS
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        // ProtonMail Bridge uses self-signed certificates by default
        // Allow users to control certificate validation for security
        rejectUnauthorized: options.reject_unauthorized ?? false,
      },
    });
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
