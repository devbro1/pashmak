import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { prepareEmails } from "../helper.mjs";

/**
 * Configuration options for the FunctionProvider.
 */
export type FunctionProviderConfig = {
  /** Default sender email address */
  default_from: string;
};

/**
 * Mailer provider that uses a custom function to send emails.
 * Useful for testing or custom email sending logic.
 */
export class FunctionProvider implements MailerProvider {
  private defaultFrom: string = "";

  /**
   * Creates a new FunctionProvider instance.
   * @param func - Function to call for sending emails
   * @param config - Provider configuration options
   */
  constructor(
    private func: Function,
    private config: FunctionProviderConfig,
  ) {
    this.defaultFrom = config.default_from;
  }

  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void {
    this.defaultFrom = from;
  }

  /**
   * Sends an email by calling the configured function.
   * @param mail - The email message to send
   */
  async sendMail(mail: Mailable): Promise<void> {
    mail.to = prepareEmails(mail.to);
    mail.cc = prepareEmails(mail.cc);
    mail.bcc = prepareEmails(mail.bcc);
    mail.from = mail.from || this.defaultFrom;

    await this.func(mail);
  }
}
