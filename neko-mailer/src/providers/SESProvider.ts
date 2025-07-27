import { Mailable } from "../Mailable";
import { MailerProvider } from "../MailerProvider";
import {
  SESClient,
  SESClientConfig,
  SendEmailCommand,
} from "@aws-sdk/client-ses";
import { prepareEmails } from "../helper";

export class SESProvider implements MailerProvider {
  private sesClient: SESClient;
  private defaultFrom: string = "";

  constructor(options: SESClientConfig = {}) {
    this.sesClient = new SESClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      ...options,
    });
  }

  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  async sendMail(mail: Mailable): Promise<void> {
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
