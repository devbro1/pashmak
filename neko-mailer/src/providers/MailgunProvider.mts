import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the MailgunProvider.
 */
export type MailgunProviderOptions = {
  /** Mailgun API key */
  api_key: string;
  /** Mailgun domain */
  domain: string;
  /** Default sender email address */
  default_from: string;
  /** Use EU servers (default: false) */
  eu?: boolean;
};

/**
 * Mailer provider that sends emails via Mailgun API.
 * Supports both US and EU Mailgun servers.
 * API key and domain can be provided via configuration or environment variables.
 */
export class MailgunProvider implements MailerProvider {
  private defaultFrom: string = "";
  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  /**
   * Creates a new MailgunProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<MailgunProviderOptions> = {}) {
    this.apiKey = options.api_key || process.env.MAILGUN_API_KEY || "";
    this.domain = options.domain || process.env.MAILGUN_DOMAIN || "";
    this.defaultFrom = options.default_from || "";

    // Mailgun has different endpoints for EU and US
    const subdomain = options.eu ? "eu." : "";
    this.baseUrl = `https://api.${subdomain}mailgun.net/v3/${this.domain}`;
  }

  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  /**
   * Sends an email via Mailgun API.
   * @param mail - The email message to send
   * @throws Error if the Mailgun API request fails
   */
  async sendMail(mail: Mailable): Promise<void> {
    const formData = new URLSearchParams();
    formData.append("from", mail.from || this.defaultFrom);
    formData.append("subject", mail.subject);
    formData.append("text", await mail.getTextContent());
    formData.append("html", await mail.getHtmlContent());

    const toEmails = prepareEmails(mail.to);
    toEmails.forEach((email) => formData.append("to", email));

    const ccEmails = prepareEmails(mail.cc);
    ccEmails.forEach((email) => formData.append("cc", email));

    const bccEmails = prepareEmails(mail.bcc);
    bccEmails.forEach((email) => formData.append("bcc", email));

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from("api:" + this.apiKey).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Mailgun API error: ${response.status} ${response.statusText}`,
      );
    }
  }
}
