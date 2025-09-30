---
sidebar_position: 2
---

# Email

Pashmak provides a simple way to send emails using different drivers.

## Config setup

```ts
// app/config/email.ts
export default {
  mailer: {
    default: {
      provider: "SES",
      default_from: "no-reply@devbro.com",
    },
  },
  $prod: {
    mailer: {
      default: {
        provider: "SES",
        // credentials are loaded as env vars
      },
    },
  },
  $test: {
    mailer: {
      default: {
        provider: "MEMORY",
        // credentials are loaded as env vars
      },
    },
  },
};
```

## Mailable

You can create a mailable class to handle your email logic.

```ts
import { Mailable } from "@devbro/pashmak/mailer";
import { config } from "@devbro/pashmak/config";

export class PasswordResetMail implements Mailable {
  from: string = config.get("mailer.default.default_from");
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string = "Password Reset Request";

  constructor(
    private userEmail: string,
    private userName: string,
    private resetUrl: string,
  ) {
    this.to = userEmail;
  }

  async getTextContent(): Promise<string> {
    return `
Hello ${this.userName},

You have requested to reset your password. Please click the link below to reset your password:

${this.resetUrl}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Pashmak Team`.trim();
  }

  async getHtmlContent(): Promise<string> {
    return `Hello ${this.userName},<br/>
<br/>
<div>You have requested to reset your password. Please click the link below to reset your password:</div>
<div><a href="${this.resetUrl}">${this.resetUrl}</a></div>
<div>This link will expire in 1 hour.</div>
<div>If you did not request this password reset, please ignore this email.</div>
Best regards,<br/>
Pashmak Team`.trim();
  }
}
```

Once you have your mailable object you can send it using the mailer facade.

```ts
import { mailer } from "@devbro/pashmak/facades";

const mail = new PasswordResetMail(
  user.email,
  `${user.first_name} ${user.last_name}`.trim() || "User",
  resetUrl,
);
await mailer().send(mail);
```

## Creating a custom provider

Let's say you want to create a custom provider for your email service. You can do so by creating a class that implements the MailProvider interface.
then register the provider with `MailerFactory` then reference it in your config:

```ts
import { Mailable } from "../Mailable.mjs";
import { MailerProvider } from "../MailerProvider.mjs";

export class MeowProvider implements MailerProvider {
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

import { MailerFactory } from "@devbro/pashmak/factories";

MailerFactory.register("MeowMailer", (config) => {
  return new MeowProvider(config);
});
```

```ts
// app/config/email.ts
export default {
  mailer: {
    default: {
      provider: 'MeowMailer',
      config: { ??? }, /* optional config object that will be passed to your provider */
    },
  },
};
```

## Registering your own Provider
TODO: add how to do it