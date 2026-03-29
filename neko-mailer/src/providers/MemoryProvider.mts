import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the MemoryProvider.
 */
export type MemoryProviderConfig = {
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that stores sent emails in memory.
 * Useful for testing without actually sending emails.
 */
export class MemoryProvider implements MailerProvider {
  private defaultFrom: string = "";
  /** Array of emails that have been "sent" (stored in memory) */
  public sentEmails: {
    from: string;
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    text: string;
    html: string;
  }[] = [];

  /**
   * Creates a new MemoryProvider instance.
   * @param config - Provider configuration options
   */
  constructor(private config: Partial<MemoryProviderConfig> = {}) {
    this.defaultFrom = config.default_from || "";
  }

  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  /**
   * "Sends" an email by storing it in memory.
   * @param mail - The email message to send
   */
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
