import { describe, expect, test } from "vitest";
import { Mailer, Mailable, MailerProvider, FunctionProvider } from "@/index";

describe("basic tests", () => {
  test("basic testing", async () => {
    class HelloMail implements Mailable {
      to: string | string[] = [];
      from: string = "";
      cc: string | string[] = [];
      bcc: string | string[] = [];

      subject = "Hello";
      getTextContent = () => "Hello World";
      getHtmlContent = () => "<h1>Hello World</h1>";
    }

    let mails: Mailable[] = [];
    let p1: MailerProvider = new FunctionProvider((mail: Mailable) => {
      mails.push(mail);
    });

    p1.setDefaultFrom("backup@example.com");

    let mail = new HelloMail();
    mail.to = "recipient@example.com";
    mail.from = "hello@example.com";
    mail.cc = ["cc@example.com"];
    mail.bcc = ["bcc@example.com"];

    let mailer: Mailer = new Mailer(p1);

    await mailer.send(mail);
    expect(mails.length).toBe(1);
    expect(mails[0].to).toEqual(["recipient@example.com"]);
    expect(mails[0].from).toEqual("hello@example.com");
    expect(mails[0].cc).toEqual(["cc@example.com"]);
    expect(mails[0].bcc).toEqual(["bcc@example.com"]);

    let mail2 = new HelloMail();
    mail2.to = "recipient2@example.com";
    mail2.cc = ["cc2@example.com"];
    mail2.bcc = ["bcc2@example.com"];

    await mailer.send(mail2);
    expect(mails.length).toBe(2);
    expect(mails[1].to).toEqual(["recipient2@example.com"]);
    expect(mails[1].from).toEqual("backup@example.com");
    expect(mails[1].cc).toEqual(["cc2@example.com"]);
    expect(mails[1].bcc).toEqual(["bcc2@example.com"]);
  });
});
