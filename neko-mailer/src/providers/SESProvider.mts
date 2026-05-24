import type * as AwsSes from "@aws-sdk/client-ses";
import { loadPackage, prepareEmails } from "../helper.mjs";
import type { Mailable } from "../Mailable.mjs";
import type { MailerProvider } from "../MailerProvider.mjs";

/**
 * Configuration options for the SESProvider.
 */
export type SESProviderConfig = {
  /** AWS SES client configuration */
  sesClientConfig: AwsSes.SESClientConfig;
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that sends emails via Amazon SES (Simple Email Service).
 * Supports AWS credentials from environment variables or explicit configuration.
 */
export class SESProvider implements MailerProvider {
  private sesClient!: AwsSes.SESClient;
  private defaultFrom: string = "";
  private static sesModule: typeof AwsSes;

  /**
   * Creates a new SESProvider instance.
   * @param options - Provider configuration options
   */
  constructor(options: Partial<SESProviderConfig> = {}) {
    if (!SESProvider.sesModule) {
      SESProvider.sesModule = loadPackage("@aws-sdk/client-ses");
    }
    const { SESClient } = SESProvider.sesModule;
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      ...options.sesClientConfig,
    });

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
   * Sends an email via Amazon SES.
   * @param mail - The email message to send
   */
  async sendMail(mail: Mailable): Promise<void> {
    const { SendEmailCommand } = SESProvider.sesModule;
    const command = new SendEmailCommand({
      Source: mail.from || this.defaultFrom,
      Destination: {
        ToAddresses: prepareEmails(mail.to),
      },
      Message: {
        Subject: {
          Data: mail.subject,
        },
        Body: {
          Text: {
            Data: await mail.getTextContent(),
          },
          Html: {
            Data: await mail.getHtmlContent(),
          },
        },
      },
    });
    if (mail.cc) {
      command.input.Destination!.CcAddresses = prepareEmails(mail.cc);
    }
    if (mail.bcc) {
      command.input.Destination!.BccAddresses = prepareEmails(mail.bcc);
    }

    await this.sesClient.send(command);
  }
}
