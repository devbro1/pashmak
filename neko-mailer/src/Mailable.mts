/**
 * Interface representing an email message.
 * Defines the structure for email data that can be sent through various providers.
 */
export interface Mailable {
  /** Sender email address */
  from: string;
  /** Recipient email address(es) */
  to: string | string[];
  /** CC (carbon copy) email address(es) */
  cc?: string | string[];
  /** BCC (blind carbon copy) email address(es) */
  bcc?: string | string[];

  /** Email subject line */
  subject: string;
  /**
   * Gets the plain text content of the email.
   * @returns The text content as a string
   */
  getTextContent(): Promise<string>;
  /**
   * Gets the HTML content of the email.
   * @returns The HTML content as a string
   */
  getHtmlContent(): Promise<string>;
}
