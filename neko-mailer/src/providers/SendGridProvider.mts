import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the SendGridProvider.
 */
export type SendGridProviderConfig = {
  /** SendGrid API key */
  api_key: string;
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that sends emails via SendGrid API.
 * Supports API key from configuration or SENDGRID_API_KEY environment variable.
 */
export class SendGridProvider implements MailerProvider {
  private defaultFrom: string = "";
  private apiKey: string;

  /**
   * Creates a new SendGridProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<SendGridProviderConfig> = {}) {
    this.apiKey = options.api_key || process.env.SENDGRID_API_KEY || "";
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
   * Maps email addresses to SendGrid email objects.
   * @param emails - Array of email addresses
   * @param required - Whether the field is required
   * @returns Array of email objects or undefined if not required and empty
   */
  private mapToEmailObjects(
    emails: string[],
    required: boolean = false,
  ): { email: string }[] | undefined {
    if (emails.length === 0 && !required) {
      return undefined;
    }
    return emails.map((email) => ({ email }));
  }

  /**
   * Sends an email via SendGrid API.
   * @param mail - The email message to send
   * @throws Error if the SendGrid API request fails
   */
  async sendMail(mail: Mailable): Promise<void> {
    const msg = {
      from: mail.from || this.defaultFrom,
      to: prepareEmails(mail.to),
      cc: prepareEmails(mail.cc),
      bcc: prepareEmails(mail.bcc),
      subject: mail.subject,
      text: await mail.getTextContent(),
      html: await mail.getHtmlContent(),
    };

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: this.mapToEmailObjects(msg.to, true),
            cc: this.mapToEmailObjects(msg.cc),
            bcc: this.mapToEmailObjects(msg.bcc),
            subject: msg.subject,
          },
        ],
        from: { email: msg.from },
        content: [
          {
            type: "text/plain",
            value: msg.text,
          },
          {
            type: "text/html",
            value: msg.html,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `SendGrid API error: ${response.status} ${response.statusText}`,
      );
    }
  }
}
