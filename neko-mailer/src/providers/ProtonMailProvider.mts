import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import nodemailer from "nodemailer";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the ProtonMailProvider.
 */
export type ProtonMailProviderConfig = {
  /** ProtonMail Bridge host (default: 127.0.0.1) */
  bridge_host?: string;
  /** ProtonMail Bridge port (default: 1025) */
  bridge_port?: number;
  /** ProtonMail username */
  username: string;
  /** ProtonMail password */
  password: string;
  /** Default sender email address */
  default_from: string;
  /** Whether to verify SSL certificates (default: false for Bridge) */
  reject_unauthorized?: boolean;
};

/**
 * Mailer provider that sends emails via ProtonMail Bridge SMTP.
 * Requires ProtonMail Bridge to be installed and running locally.
 * @see https://proton.me/mail/bridge
 */
export class ProtonMailProvider implements MailerProvider {
  private defaultFrom: string = "";
  private transporter;

  /**
   * Creates a new ProtonMailProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<ProtonMailProviderConfig> = {}) {
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

  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  /**
   * Sends an email via ProtonMail Bridge SMTP.
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
