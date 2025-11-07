import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export type SendGridProviderOptions = {
  api_key: string;
  default_from: string;
};

export class SendGridProvider implements MailerProvider {
  private defaultFrom: string = "";
  private apiKey: string;

  constructor(options: Partial<SendGridProviderOptions> = {}) {
    this.apiKey = options.api_key || process.env.SENDGRID_API_KEY || "";
    this.defaultFrom = options.default_from || "";
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  private mapToEmailObjects(emails: string[]): { email: string }[] | undefined {
    return emails.length > 0 ? emails.map((email) => ({ email })) : undefined;
  }

  private mapToRequiredEmailObjects(emails: string[]): { email: string }[] {
    return emails.map((email) => ({ email }));
  }

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
            to: this.mapToRequiredEmailObjects(msg.to),
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
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }
  }
}
