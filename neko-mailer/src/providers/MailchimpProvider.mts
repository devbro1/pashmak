import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export type MailchimpProviderOptions = {
  api_key: string;
  default_from: string;
};

interface MailchimpRecipient {
  email: string;
  status: "sent" | "queued" | "scheduled" | "rejected" | "invalid";
  reject_reason?: string;
  _id?: string;
}

/**
 * Mailchimp Transactional (Mandrill) provider
 * Uses Mailchimp's transactional email API (formerly Mandrill)
 */
export class MailchimpProvider implements MailerProvider {
  private defaultFrom: string = "";
  private apiKey: string;

  constructor(options: Partial<MailchimpProviderOptions> = {}) {
    this.apiKey = options.api_key || process.env.MAILCHIMP_API_KEY || "";
    this.defaultFrom = options.default_from || "";
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  async sendMail(mail: Mailable): Promise<void> {
    const toEmails = prepareEmails(mail.to);
    const ccEmails = prepareEmails(mail.cc);
    const bccEmails = prepareEmails(mail.bcc);

    const message = {
      from_email: mail.from || this.defaultFrom,
      subject: mail.subject,
      text: await mail.getTextContent(),
      html: await mail.getHtmlContent(),
      to: [
        ...toEmails.map((email) => ({ email, type: "to" })),
        ...ccEmails.map((email) => ({ email, type: "cc" })),
        ...bccEmails.map((email) => ({ email, type: "bcc" })),
      ],
    };

    const response = await fetch(
      "https://mandrillapp.com/api/1.0/messages/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: this.apiKey,
          message,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Mailchimp API error: ${response.status} ${response.statusText}`,
      );
    }

    const result: MailchimpRecipient[] = await response.json();

    // Check if any email was rejected
    if (Array.isArray(result)) {
      const rejected = result.filter(
        (r) => r.status === "rejected" || r.status === "invalid",
      );
      if (rejected.length > 0) {
        throw new Error(`Mailchimp rejected ${rejected.length} email(s)`);
      }
    }
  }
}
