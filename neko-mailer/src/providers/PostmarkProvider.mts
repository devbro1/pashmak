import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the PostmarkProvider.
 */
export type PostmarkProviderConfig = {
  /** Postmark server token */
  server_token: string;
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that sends emails via Postmark API.
 * Supports server token from configuration or POSTMARK_SERVER_TOKEN environment variable.
 */
export class PostmarkProvider implements MailerProvider {
  private defaultFrom: string = "";
  private serverToken: string;

  /**
   * Creates a new PostmarkProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<PostmarkProviderConfig> = {}) {
    this.serverToken =
      options.server_token || process.env.POSTMARK_SERVER_TOKEN || "";
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
   * Sends an email via Postmark API.
   * @param mail - The email message to send
   * @throws Error if the Postmark API request fails
   */
  async sendMail(mail: Mailable): Promise<void> {
    const toEmails = prepareEmails(mail.to);
    const ccEmails = prepareEmails(mail.cc);
    const bccEmails = prepareEmails(mail.bcc);

    const emailData = {
      From: mail.from || this.defaultFrom,
      To: toEmails.join(","),
      Cc: ccEmails.length > 0 ? ccEmails.join(",") : undefined,
      Bcc: bccEmails.length > 0 ? bccEmails.join(",") : undefined,
      Subject: mail.subject,
      TextBody: await mail.getTextContent(),
      HtmlBody: await mail.getHtmlContent(),
    };

    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": this.serverToken,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      throw new Error(
        `Postmark API error: ${response.status} ${response.statusText}`,
      );
    }
  }
}
