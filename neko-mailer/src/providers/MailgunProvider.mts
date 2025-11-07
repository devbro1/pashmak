import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export type MailgunProviderOptions = {
  api_key: string;
  domain: string;
  default_from: string;
  eu?: boolean; // Use EU servers
};

export class MailgunProvider implements MailerProvider {
  private defaultFrom: string = "";
  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  constructor(options: Partial<MailgunProviderOptions> = {}) {
    this.apiKey = options.api_key || process.env.MAILGUN_API_KEY || "";
    this.domain = options.domain || process.env.MAILGUN_DOMAIN || "";
    this.defaultFrom = options.default_from || "";
    
    // Mailgun has different endpoints for EU and US
    const subdomain = options.eu ? "eu." : "";
    this.baseUrl = `https://api.${subdomain}mailgun.net/v3/${this.domain}`;
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

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
      throw new Error(`Mailgun API error: ${response.status} ${response.statusText}`);
    }
  }
}
