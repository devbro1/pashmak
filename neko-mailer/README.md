# @devbro/neko-mailer

A powerful and flexible email sending library for Node.js applications with support for multiple providers (SMTP, SendGrid, AWS SES, Mailgun, Postmark) and advanced features like templating, attachments, queuing, and monitoring.

[![npm version](https://badge.fury.io/js/%40devbro%2Fneko-mailer.svg)](https://www.npmjs.com/package/@devbro/neko-mailer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Email Providers](#email-providers)
- [Templating](#templating)
- [Attachments](#attachments)
- [Advanced Features](#advanced-features)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [TypeScript Support](#typescript-support)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @devbro/neko-mailer
```

### Provider-Specific Dependencies

Depending on your email provider, install the appropriate package:

```bash
# SMTP (built-in with nodemailer)
npm install nodemailer

# SendGrid
npm install @sendgrid/mail

# AWS SES
npm install @aws-sdk/client-ses

# Mailgun
npm install mailgun.js

# Postmark
npm install postmark
```

## Features

- **Multiple Providers**: SMTP, SendGrid, AWS SES, Mailgun, Postmark
- **Template Support**: Handlebars, EJS, Pug, and custom template engines
- **Attachments**: Files, buffers, streams, and inline images
- **Queue Integration**: Background email sending with retry logic
- **Email Validation**: Built-in email address validation
- **HTML & Plain Text**: Automatic plain text generation from HTML
- **Internationalization**: Multi-language email support
- **Tracking**: Open and click tracking (provider-dependent)
- **Testing**: Preview emails without sending (development mode)
- **Type Safety**: Full TypeScript support with generics
- **Error Handling**: Comprehensive error types and retry strategies

## Quick Start

### Basic SMTP Setup

```typescript
import { NekoMailer, SMTPProvider } from "@devbro/neko-mailer";

// Initialize mailer with SMTP
const mailer = new NekoMailer({
  provider: new SMTPProvider({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  }),
  from: {
    name: "My App",
    email: "noreply@myapp.com",
  },
});

// Send a simple email
await mailer.send({
  to: "user@example.com",
  subject: "Welcome to My App",
  html: "<h1>Welcome!</h1><p>Thanks for signing up.</p>",
  text: "Welcome! Thanks for signing up.",
});
```

### Using SendGrid

```typescript
import { NekoMailer, SendGridProvider } from "@devbro/neko-mailer";

const mailer = new NekoMailer({
  provider: new SendGridProvider({
    apiKey: process.env.SENDGRID_API_KEY!,
  }),
  from: {
    name: "My App",
    email: "noreply@myapp.com",
  },
});

await mailer.send({
  to: "user@example.com",
  subject: "Password Reset",
  html: '<p>Click <a href="{{resetUrl}}">here</a> to reset your password.</p>',
  data: {
    resetUrl: "https://myapp.com/reset/token123",
  },
});
```

## Core Concepts

### Mailer Configuration

```typescript
interface MailerConfig {
  provider: EmailProvider; // Email provider instance
  from: EmailAddress; // Default sender
  replyTo?: EmailAddress; // Default reply-to address
  templateEngine?: TemplateEngine; // Template engine for rendering
  queue?: QueueAdapter; // Queue for background sending
  development?: boolean; // Development mode (preview only)
  trackOpens?: boolean; // Enable open tracking
  trackClicks?: boolean; // Enable click tracking
}

interface EmailAddress {
  email: string;
  name?: string;
}
```

### Email Message Structure

```typescript
interface EmailMessage {
  to: string | string[] | EmailAddress | EmailAddress[];
  subject: string;
  html?: string; // HTML content
  text?: string; // Plain text content
  from?: EmailAddress; // Override default sender
  cc?: string | string[]; // CC recipients
  bcc?: string | string[]; // BCC recipients
  replyTo?: EmailAddress; // Reply-to address
  attachments?: Attachment[]; // File attachments
  headers?: Record<string, string>; // Custom headers
  priority?: "high" | "normal" | "low";
  data?: Record<string, any>; // Template variables
  template?: string; // Template name
  tags?: string[]; // Email tags (for tracking)
}
```

## Email Providers

### SMTP Provider

```typescript
import { SMTPProvider } from "@devbro/neko-mailer";

const smtp = new SMTPProvider({
  host: "smtp.example.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "username",
    pass: "password",
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  rateDelta: 1000,
  rateLimit: 5, // Max 5 emails per second
});
```

### SendGrid Provider

```typescript
import { SendGridProvider } from "@devbro/neko-mailer";

const sendgrid = new SendGridProvider({
  apiKey: process.env.SENDGRID_API_KEY!,
  sandboxMode: false, // Enable for testing without sending
  ipPoolName: "transactional", // Optional IP pool
});
```

### AWS SES Provider

```typescript
import { SESProvider } from "@devbro/neko-mailer";

const ses = new SESProvider({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  configurationSetName: "my-config-set", // Optional
});
```

### Mailgun Provider

```typescript
import { MailgunProvider } from "@devbro/neko-mailer";

const mailgun = new MailgunProvider({
  apiKey: process.env.MAILGUN_API_KEY!,
  domain: "mg.example.com",
  host: "api.eu.mailgun.net", // Use EU endpoint if needed
});
```

### Postmark Provider

```typescript
import { PostmarkProvider } from "@devbro/neko-mailer";

const postmark = new PostmarkProvider({
  serverToken: process.env.POSTMARK_SERVER_TOKEN!,
  messageStream: "outbound", // 'outbound' or 'broadcasts'
});
```

## Templating

### Using Handlebars Templates

```typescript
import { NekoMailer, HandlebarsEngine } from "@devbro/neko-mailer";
import path from "path";

const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  templateEngine: new HandlebarsEngine({
    templatesDir: path.join(__dirname, "templates"),
    partialsDir: path.join(__dirname, "templates/partials"),
    defaultLayout: "main",
  }),
});

// Send with template
await mailer.send({
  to: "user@example.com",
  subject: "Welcome {{username}}!",
  template: "welcome", // loads templates/welcome.hbs
  data: {
    username: "John",
    activationUrl: "https://myapp.com/activate/xyz",
  },
});
```

**Template File** (`templates/welcome.hbs`):

```handlebars
<h1>Welcome, {{username}}!</h1>
<p>Thanks for joining our platform.</p>
<p>
  <a href="{{activationUrl}}">Activate your account</a>
</p>

{{> footer}}
```

### Using EJS Templates

```typescript
import { EJSEngine } from "@devbro/neko-mailer";

const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  templateEngine: new EJSEngine({
    templatesDir: path.join(__dirname, "templates"),
  }),
});
```

### Custom Template Engine

```typescript
import { TemplateEngine } from "@devbro/neko-mailer";

class MyTemplateEngine implements TemplateEngine {
  async render(template: string, data: Record<string, any>): Promise<string> {
    // Your custom rendering logic
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || "");
  }
}

const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  templateEngine: new MyTemplateEngine(),
});
```

## Attachments

### File Attachments

```typescript
await mailer.send({
  to: "user@example.com",
  subject: "Invoice #12345",
  html: "<p>Please find your invoice attached.</p>",
  attachments: [
    {
      filename: "invoice.pdf",
      path: "/path/to/invoice.pdf",
    },
    {
      filename: "logo.png",
      path: "/path/to/logo.png",
      cid: "logo", // For inline images
    },
  ],
});
```

### Buffer Attachments

```typescript
const pdfBuffer = await generateInvoicePDF(orderId);

await mailer.send({
  to: "user@example.com",
  subject: "Invoice #12345",
  html: "<p>Your invoice is attached.</p>",
  attachments: [
    {
      filename: "invoice.pdf",
      content: pdfBuffer,
      contentType: "application/pdf",
    },
  ],
});
```

### Inline Images

```typescript
await mailer.send({
  to: "user@example.com",
  subject: "Newsletter",
  html: `
    <h1>Monthly Newsletter</h1>
    <img src="cid:header" alt="Header" />
    <p>Check out our latest updates!</p>
  `,
  attachments: [
    {
      filename: "header.jpg",
      path: "/path/to/header.jpg",
      cid: "header", // Referenced in HTML as src="cid:header"
    },
  ],
});
```

## Advanced Features

### Queue Integration

```typescript
import { NekoMailer } from "@devbro/neko-mailer";
import { RedisQueue } from "@devbro/neko-queue";

const queue = new RedisQueue({
  connection: {
    host: "localhost",
    port: 6379,
  },
});

const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  queue: queue,
});

// Emails are now sent in background
await mailer.send({
  to: "user@example.com",
  subject: "Welcome!",
  html: "<h1>Welcome to our platform</h1>",
});
// Returns immediately, email queued for sending
```

### Batch Sending

```typescript
const recipients = [
  { email: "user1@example.com", name: "User 1" },
  { email: "user2@example.com", name: "User 2" },
  { email: "user3@example.com", name: "User 3" },
];

// Send to multiple recipients with personalization
for (const recipient of recipients) {
  await mailer.send({
    to: recipient,
    subject: `Hello ${recipient.name}`,
    template: "newsletter",
    data: {
      name: recipient.name,
      unsubscribeUrl: `https://myapp.com/unsubscribe/${recipient.email}`,
    },
  });
}

// Or use batch send (provider-dependent)
await mailer.sendBatch({
  recipients: recipients,
  subject: "Newsletter",
  template: "newsletter",
  data: (recipient) => ({
    name: recipient.name,
    unsubscribeUrl: `https://myapp.com/unsubscribe/${recipient.email}`,
  }),
});
```

### Email Validation

```typescript
import { validateEmail, validateEmailList } from "@devbro/neko-mailer";

// Validate single email
const isValid = validateEmail("user@example.com"); // true
const isInvalid = validateEmail("invalid-email"); // false

// Validate list of emails
const emails = ["user1@example.com", "invalid", "user2@example.com"];
const { valid, invalid } = validateEmailList(emails);
console.log(valid); // ['user1@example.com', 'user2@example.com']
console.log(invalid); // ['invalid']
```

### Development Mode

```typescript
// Preview emails without actually sending
const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  development: true, // Enables preview mode
});

// Email will be logged to console instead of sent
await mailer.send({
  to: "user@example.com",
  subject: "Test Email",
  html: "<h1>This is a test</h1>",
});

// Or use preview explicitly
const preview = await mailer.preview({
  to: "user@example.com",
  subject: "Test Email",
  template: "welcome",
  data: { username: "John" },
});

console.log(preview.html);
console.log(preview.text);
```

### Retry Logic

```typescript
import { NekoMailer, RetryStrategy } from "@devbro/neko-mailer";

const mailer = new NekoMailer({
  provider: smtpProvider,
  from: { email: "noreply@myapp.com" },
  retry: new RetryStrategy({
    maxAttempts: 3,
    delay: 1000, // 1 second
    backoff: "exponential", // exponential or linear
  }),
});

try {
  await mailer.send({
    to: "user@example.com",
    subject: "Important",
    html: "<p>This will retry on failure</p>",
  });
} catch (error) {
  console.error("Failed after 3 attempts:", error);
}
```

### Custom Headers

```typescript
await mailer.send({
  to: "user@example.com",
  subject: "Custom Headers",
  html: "<p>Email with custom headers</p>",
  headers: {
    "X-Campaign-ID": "summer-2026",
    "X-User-ID": "12345",
    "List-Unsubscribe": "<mailto:unsubscribe@myapp.com>",
  },
});
```

## Real-World Examples

### User Registration Email

```typescript
// Controller
async function registerUser(email: string, username: string) {
  const user = await createUser(email, username);
  const token = generateActivationToken(user.id);

  await mailer.send({
    to: { email: user.email, name: username },
    subject: "Activate Your Account",
    template: "activation",
    data: {
      username: username,
      activationUrl: `https://myapp.com/activate?token=${token}`,
      expiresIn: "24 hours",
    },
    tags: ["registration", "activation"],
  });

  return user;
}
```

**Template** (`templates/activation.hbs`):

```handlebars
<html>
  <head>
    <style>
      .button {
        background-color: #4caf50;
        color: white;
        padding: 14px 20px;
        text-decoration: none;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <h1>Welcome, {{username}}!</h1>
    <p>Thanks for signing up. Please activate your account within
      {{expiresIn}}.</p>
    <p>
      <a href="{{activationUrl}}" class="button">Activate Account</a>
    </p>
    <p>If the button doesn't work, copy and paste this link:</p>
    <p>{{activationUrl}}</p>
  </body>
</html>
```

### Password Reset

```typescript
async function sendPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const token = generateResetToken(user.id);

  await mailer.send({
    to: user.email,
    subject: "Reset Your Password",
    template: "password-reset",
    data: {
      username: user.username,
      resetUrl: `https://myapp.com/reset-password?token=${token}`,
      expiresIn: "1 hour",
      ipAddress: getCurrentIP(),
      timestamp: new Date().toLocaleString(),
    },
    priority: "high",
    tags: ["security", "password-reset"],
  });
}
```

### Order Confirmation with Invoice

```typescript
async function sendOrderConfirmation(orderId: string) {
  const order = await getOrder(orderId);
  const invoice = await generateInvoicePDF(orderId);

  await mailer.send({
    to: {
      email: order.customer.email,
      name: order.customer.name,
    },
    subject: `Order Confirmation #${order.id}`,
    template: "order-confirmation",
    data: {
      customerName: order.customer.name,
      orderId: order.id,
      orderDate: order.createdAt,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      shipping: order.shipping,
      total: order.total,
      trackingUrl: order.trackingUrl,
    },
    attachments: [
      {
        filename: `invoice-${order.id}.pdf`,
        content: invoice,
        contentType: "application/pdf",
      },
    ],
    tags: ["order", "confirmation", "transactional"],
  });
}
```

### Weekly Newsletter

```typescript
async function sendWeeklyNewsletter() {
  const subscribers = await getActiveSubscribers();
  const latestPosts = await getLatestBlogPosts(5);

  for (const subscriber of subscribers) {
    await mailer.send({
      to: subscriber.email,
      subject: "Your Weekly Update",
      template: "newsletter",
      data: {
        subscriberName: subscriber.name,
        posts: latestPosts.map((post) => ({
          title: post.title,
          excerpt: post.excerpt,
          url: `https://myapp.com/blog/${post.slug}`,
          image: post.featuredImage,
        })),
        unsubscribeUrl: `https://myapp.com/unsubscribe?token=${subscriber.unsubscribeToken}`,
      },
      tags: ["newsletter", "weekly"],
      trackOpens: true,
      trackClicks: true,
    });
  }
}
```

## Best Practices

### 1. Environment Configuration

```typescript
// config/mailer.ts
import {
  NekoMailer,
  SMTPProvider,
  SendGridProvider,
} from "@devbro/neko-mailer";

export function createMailer() {
  const isDevelopment = process.env.NODE_ENV === "development";

  let provider;
  if (process.env.SENDGRID_API_KEY) {
    provider = new SendGridProvider({
      apiKey: process.env.SENDGRID_API_KEY,
    });
  } else {
    provider = new SMTPProvider({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || "587"),
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  return new NekoMailer({
    provider,
    from: {
      name: process.env.EMAIL_FROM_NAME || "My App",
      email: process.env.EMAIL_FROM_ADDRESS!,
    },
    development: isDevelopment,
  });
}

export const mailer = createMailer();
```

### 2. Separate Email Service Layer

```typescript
// services/email.service.ts
import { mailer } from "../config/mailer";
import { User } from "../models/User";

export class EmailService {
  async sendWelcomeEmail(user: User) {
    return mailer.send({
      to: { email: user.email, name: user.name },
      subject: "Welcome to Our Platform",
      template: "welcome",
      data: { username: user.name },
      tags: ["onboarding", "welcome"],
    });
  }

  async sendPasswordReset(user: User, token: string) {
    return mailer.send({
      to: user.email,
      subject: "Reset Your Password",
      template: "password-reset",
      data: {
        username: user.name,
        resetUrl: `https://myapp.com/reset?token=${token}`,
      },
      priority: "high",
      tags: ["security"],
    });
  }

  async sendOrderConfirmation(order: Order) {
    const invoice = await this.generateInvoice(order);

    return mailer.send({
      to: order.customer.email,
      subject: `Order #${order.id} Confirmed`,
      template: "order-confirmation",
      data: { order },
      attachments: [
        {
          filename: `invoice-${order.id}.pdf`,
          content: invoice,
        },
      ],
      tags: ["order", "transactional"],
    });
  }

  private async generateInvoice(order: Order): Promise<Buffer> {
    // Generate PDF invoice
    return Buffer.from("...");
  }
}

export const emailService = new EmailService();
```

### 3. Error Handling

```typescript
import { MailerError, ProviderError } from "@devbro/neko-mailer";

try {
  await mailer.send({
    to: "user@example.com",
    subject: "Test",
    html: "<p>Test email</p>",
  });
} catch (error) {
  if (error instanceof ProviderError) {
    console.error("Provider error:", error.provider, error.code);
    // Log to monitoring service
    await logger.error("Email provider failed", {
      provider: error.provider,
      code: error.code,
      message: error.message,
    });
  } else if (error instanceof MailerError) {
    console.error("Mailer error:", error.message);
  } else {
    throw error;
  }
}
```

### 4. Testing

```typescript
// tests/email.test.ts
import { NekoMailer, MockProvider } from "@devbro/neko-mailer";
import { emailService } from "../services/email.service";

describe("EmailService", () => {
  let mockProvider: MockProvider;
  let mailer: NekoMailer;

  beforeEach(() => {
    mockProvider = new MockProvider();
    mailer = new NekoMailer({
      provider: mockProvider,
      from: { email: "test@example.com" },
    });
  });

  it("should send welcome email", async () => {
    const user = { email: "user@example.com", name: "John" };

    await mailer.send({
      to: user.email,
      subject: "Welcome",
      template: "welcome",
      data: { username: user.name },
    });

    expect(mockProvider.sentEmails).toHaveLength(1);
    expect(mockProvider.sentEmails[0].to).toBe(user.email);
    expect(mockProvider.sentEmails[0].subject).toBe("Welcome");
  });
});
```

### 5. Rate Limiting

```typescript
import pLimit from "p-limit";

const limit = pLimit(10); // Max 10 concurrent emails

async function sendBulkEmails(recipients: string[]) {
  const promises = recipients.map((email) =>
    limit(() =>
      mailer.send({
        to: email,
        subject: "Newsletter",
        template: "newsletter",
        data: {
          /* ... */
        },
      }),
    ),
  );

  const results = await Promise.allSettled(promises);

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`Sent: ${succeeded}, Failed: ${failed}`);
}
```

## TypeScript Support

### Type-Safe Email Data

```typescript
interface WelcomeEmailData {
  username: string;
  activationUrl: string;
  expiresIn: string;
}

interface OrderEmailData {
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
}

// Type-safe email sending
async function sendTypedEmail<T>(to: string, template: string, data: T) {
  return mailer.send({
    to,
    subject: "Email",
    template,
    data,
  });
}

// Usage with type checking
await sendTypedEmail<WelcomeEmailData>("user@example.com", "welcome", {
  username: "John",
  activationUrl: "https://...",
  expiresIn: "24 hours",
});
```

### Custom Provider Type

```typescript
import { EmailProvider, EmailMessage, SendResult } from "@devbro/neko-mailer";

class CustomProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<SendResult> {
    // Your implementation
    return {
      messageId: "custom-id",
      accepted: [message.to as string],
      rejected: [],
      pending: [],
    };
  }

  async verify(): Promise<boolean> {
    // Verify provider configuration
    return true;
  }
}
```

## API Reference

### NekoMailer

#### Constructor

```typescript
new NekoMailer(config: MailerConfig)
```

#### Methods

- `send(message: EmailMessage): Promise<SendResult>` - Send an email
- `sendBatch(options: BatchOptions): Promise<BatchResult>` - Send to multiple recipients
- `preview(message: EmailMessage): Promise<EmailPreview>` - Preview email without sending
- `verify(): Promise<boolean>` - Verify provider configuration

### Providers

- `SMTPProvider` - Standard SMTP email sending
- `SendGridProvider` - SendGrid API integration
- `SESProvider` - AWS Simple Email Service
- `MailgunProvider` - Mailgun API integration
- `PostmarkProvider` - Postmark API integration
- `MockProvider` - Testing provider (captures emails without sending)

### Template Engines

- `HandlebarsEngine` - Handlebars template rendering
- `EJSEngine` - EJS template rendering
- `PugEngine` - Pug template rendering

### Utilities

- `validateEmail(email: string): boolean` - Validate email address
- `validateEmailList(emails: string[]): ValidationResult` - Validate list of emails
- `parseEmailAddress(address: string): EmailAddress` - Parse email with name

## Troubleshooting

### Common Issues

**SMTP Authentication Failed**

```typescript
// Use app-specific passwords for Gmail
// Enable "Less secure app access" or use OAuth2
const smtp = new SMTPProvider({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "your-email@gmail.com",
    pass: "app-specific-password", // Not your regular password
  },
});
```

**Rate Limiting**

```typescript
// Add delays between emails or use queue
import { delay } from "@devbro/neko-helper";

for (const recipient of recipients) {
  await mailer.send({
    /* ... */
  });
  await delay(100); // 100ms between emails
}
```

**Templates Not Found**

```typescript
// Ensure correct path to templates directory
import path from "path";

const templateEngine = new HandlebarsEngine({
  templatesDir: path.resolve(__dirname, "../templates"),
  // Use absolute paths or resolve relative to __dirname
});
```

**Attachments Too Large**

```typescript
// Check provider limits (usually 10-25MB)
// For large files, use links instead
await mailer.send({
  to: "user@example.com",
  subject: "Large File",
  html: `<p>Download your file: <a href="${fileUrl}">here</a></p>`,
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/devbro1/pashmak.git
cd pashmak/neko-mailer

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Related Packages

- [@devbro/neko-queue](https://www.npmjs.com/package/@devbro/neko-queue) - Background job processing for email queuing
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging for email tracking and debugging
- [@devbro/neko-config](https://www.npmjs.com/package/@devbro/neko-config) - Configuration management for email settings
- [@devbro/neko-storage](https://www.npmjs.com/package/@devbro/neko-storage) - File storage for email attachments
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework

## License

MIT

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/devbro1/pashmak/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devbro1/pashmak/discussions)
- 📖 Documentation: [https://devbro1.github.io/pashmak/](https://devbro1.github.io/pashmak/)
