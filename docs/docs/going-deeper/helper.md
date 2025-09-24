---
sidebar_position: 4
---

# Helpers

Set of useful helper functions.

## Encryption Helpers

#### getEnv(key: string, defaultValue?: any): any

Get environment variable value by key. If not found, return defaultValue.
if defaultValue is not provided, throw an error

#### isBcryptHash(str: string): boolean

Check if a string is a valid bcrypt hash.

#### encryptPassword(password: string): Promise`<string>`

Encrypt a password using bcrypt.

#### compareBcrypt(password: string, hash: string): Promise`<boolean>`

Compare a password with a bcrypt hash.

## Time Helpers

#### sleep(ms: number): Promise`<void>`

Sleep for a given number of milliseconds.

## Pattern helpers

#### export function createSingleton`<T>`(func: (...args: any[]) => T): (label?: string, ...args: any[]) => T

Create a singleton instance using a method. It will return a function that will return the singleton instance.
each singleton is identified by a label. if label is not provided, it will be a default singleton.
if the function is called again with the same label, it will return the same instance.

#### class FlexibleFactory`<T>`

A factory class that can create instances of a class with different configurations.
you first need to register different functions that will create the instance.
then you can create the instance by calling the create method with the label of the function.

```ts
import { FlexibleFactory } from "@devbro/pashmak/helpers";

class MailerFactory extends FlexibleFactory<Mailer> {}

MailerFactory.register("smtp", (config) => new SmtpMailer(config));
MailerFactory.register("sendgrid", (config) => new SendgridMailer(config));

const mailer = MailerFactory.create("smtp", { host: "smtp.example.com" });
```
