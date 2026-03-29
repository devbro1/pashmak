import { Mailable } from "Mailable.mjs";

/**
 * Interface that all mailer providers must implement.
 * Defines the contract for sending emails through different services.
 */
export interface MailerProvider {
  /**
   * Sets the default sender email address.
   * @param from - The default sender email address
   */
  setDefaultFrom(from: string): void;
  /**
   * Sends an email message.
   * @param mail - The email message to send
   */
  sendMail(mail: Mailable): Promise<void>;
}
