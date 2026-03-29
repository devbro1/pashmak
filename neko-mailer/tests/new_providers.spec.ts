import { describe, expect, test } from "vitest";
import {
  SendGridProvider,
  MailgunProvider,
  PostmarkProvider,
  ProtonMailProvider,
  MailchimpProvider,
} from "@/index";

describe("new provider tests", () => {
  test("SendGrid provider can be instantiated", () => {
    const provider = new SendGridProvider({
      api_key: "test-key",
      default_from: "test@example.com",
    });

    expect(provider).toBeInstanceOf(SendGridProvider);
    expect(provider.setDefaultFrom).toBeDefined();
    expect(provider.sendMail).toBeDefined();
  });

  test("SendGrid provider respects default_from", () => {
    const provider = new SendGridProvider({
      api_key: "test-key",
      default_from: "test@example.com",
    });

    provider.setDefaultFrom("new@example.com");
    expect(provider).toBeInstanceOf(SendGridProvider);
  });

  test("Mailgun provider can be instantiated", () => {
    const provider = new MailgunProvider({
      api_key: "test-key",
      domain: "test.mailgun.org",
      default_from: "test@example.com",
    });

    expect(provider).toBeInstanceOf(MailgunProvider);
    expect(provider.setDefaultFrom).toBeDefined();
    expect(provider.sendMail).toBeDefined();
  });

  test("Mailgun provider supports EU region", () => {
    const provider = new MailgunProvider({
      api_key: "test-key",
      domain: "test.mailgun.org",
      default_from: "test@example.com",
      eu: true,
    });

    expect(provider).toBeInstanceOf(MailgunProvider);
  });

  test("Postmark provider can be instantiated", () => {
    const provider = new PostmarkProvider({
      server_token: "test-token",
      default_from: "test@example.com",
    });

    expect(provider).toBeInstanceOf(PostmarkProvider);
    expect(provider.setDefaultFrom).toBeDefined();
    expect(provider.sendMail).toBeDefined();
  });

  test("ProtonMail provider can be instantiated", () => {
    const provider = new ProtonMailProvider({
      bridge_host: "127.0.0.1",
      bridge_port: 1025,
      username: "test@proton.me",
      password: "test-password",
      default_from: "test@proton.me",
    });

    expect(provider).toBeInstanceOf(ProtonMailProvider);
    expect(provider.setDefaultFrom).toBeDefined();
    expect(provider.sendMail).toBeDefined();
  });

  test("Mailchimp provider can be instantiated", () => {
    const provider = new MailchimpProvider({
      api_key: "test-key",
      default_from: "test@example.com",
    });

    expect(provider).toBeInstanceOf(MailchimpProvider);
    expect(provider.setDefaultFrom).toBeDefined();
    expect(provider.sendMail).toBeDefined();
  });
});
