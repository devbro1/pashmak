---
sidebar_position: 3
---

# Email

Pashmak provides a simple way to send emails using different drivers.

## Configuration

```ts
// app/config/email.ts
export default {
  default: {
    provider: "SES",
    config: {
      ???
    } as SESMailerConfig,
  },
};
```

## Mailable

To send emails, you need to create a mailable class that implements the `Mailable` interface.

```ts
import { Mailable } from "@devbro/pashmak/mailer";
import { config } from "@devbro/pashmak/config";

export class PasswordResetMail implements Mailable {
  from: string = config.get("mailer.default.default_from"); // sender email address
  to: string | string[]; // recipient email address(es)
  cc?: string | string[]; // optional cc email address(es)
  bcc?: string | string[]; // optional bcc email address(es)
  subject: string = "Hello There!"; // email subject

  // must return plain text content of the email
  async getTextContent(): Promise<string> {
    return `Hello ${this.userName}`;
  }

  // must return HTML content of the email
  async getHtmlContent(): Promise<string> {
    return `Hello ${this.userName},<br/>`;
  }
}
```

Once you have your mailable object you can send it using the mailer facade.

```ts
import { mailer } from "@devbro/pashmak/facades";

const mail = new PasswordResetMail(????);
await mailer().send(mail);
```

## Available Providers

Pashmak comes with built-in support for the following email providers:

- SMTP: Uses nodemailer with SMTP transport.
- SES: Uses AWS SES service.
- SendGrid: Uses SendGrid service.
- Mailgun: Uses Mailgun service.
- Postmark: Uses Postmark service.
- ProtonMail: Uses ProtonMail service.
- Mailchimp Transactional: Uses Mailchimp Transactional service.
- Function Provider: Allows you to define your own function.
- Memory Provider: a provider that stores emails in memory (useful for testing).

## Creating a custom provider

Let's say you want to create a custom provider for your email service. You can do so by creating a class that implements the MailProvider interface.
then register the provider with `MailerProviderFactory` then reference it in your config:

```ts
import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";
import { MeowProviderConfig } from "./MeowProviderConfig.mjs";

export class MeowProvider implements MailerProvider {
  constructor(private config: MeowProviderConfig) {
    ???
  }
  setDefaultFrom(from: string) {
    ???
  }

  async sendMail(mail: Mailable) {
    ???
  }
}
```

```ts
// initialize.ts

import { MailerProviderFactory } from "@devbro/pashmak/factories";

MailerProviderFactory.register("MeowMailer", (config) => {
  return new MeowProvider(config);
});
```

```ts
// app/config/email.ts
import { MeowProviderConfig } from "./MeowProviderConfig.mjs";

export default {
  mailer: {
    default: {
      provider: 'MeowMailer',
      config: { ??? } as MeowProviderConfig, /* optional config object that will be passed to your provider */
    },
  },
};
```
