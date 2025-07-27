export interface Mailable {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];

  subject: string;
  getTextContent(): Promise<string>;
  getHtmlContent(): Promise<string>;
}
