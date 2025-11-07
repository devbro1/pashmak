import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

export type PostmarkProviderOptions = {
  server_token: string;
  default_from: string;
};

export class PostmarkProvider implements MailerProvider {
  private defaultFrom: string = "";
  private serverToken: string;

  constructor(options: Partial<PostmarkProviderOptions> = {}) {
    this.serverToken =
      options.server_token || process.env.POSTMARK_SERVER_TOKEN || "";
    this.defaultFrom = options.default_from || "";
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

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
