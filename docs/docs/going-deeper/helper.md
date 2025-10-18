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

## Number Helpers

All number utility functions are available under the `Number` namespace:

```ts
import { Number } from "@devbro/neko-helper";

// Usage examples
Number.abbreviate(1500); // "1.5K"
Number.currencyFormat(1234.56); // "$1,234.56"
Number.fileSize(1024); // "1 KB"
```

#### Number.abbreviate(num: number): string

Abbreviates large numbers with appropriate suffixes (K, M, B, T, etc.).

```ts
import { Number } from "@devbro/neko-helper";

Number.abbreviate(1000); // "1K"
Number.abbreviate(1500); // "1.5K"
Number.abbreviate(1000000); // "1M"
Number.abbreviate(2500000); // "2.5M"
```

#### Number.clamp(num: number, min: number, max: number): number

Clamps a number between minimum and maximum values.

```ts
import { Number } from "@devbro/neko-helper";

Number.clamp(5, 1, 10); // 5
Number.clamp(-5, 1, 10); // 1
Number.clamp(15, 1, 10); // 10
```

#### Number.currencyFormat(num: number, currency?: string): string

Formats a number as currency with proper locale formatting. Default currency is USD.

```ts
import { Number } from "@devbro/neko-helper";

Number.currencyFormat(1234.56); // "$1,234.56"
Number.currencyFormat(1234.56, "EUR"); // "€1,234.56"
Number.currencyFormat(1000, "GBP"); // "£1,000.00"
```

#### Number.fileSize(num: number): string

Formats a number of bytes into a human-readable file size string.

```ts
import { Number } from "@devbro/neko-helper";

Number.fileSize(1024); // "1 KB"
Number.fileSize(1536); // "1.5 KB"
Number.fileSize(1048576); // "1 MB"
Number.fileSize(500); // "500 B"
```

#### Number.format(num: number, decimalPlaces?: number): string

Formats a number with specified decimal places and thousands separators. Default is 2 decimal places.

```ts
import { Number } from "@devbro/neko-helper";

Number.format(1234.5678); // "1,234.57"
Number.format(1234.5678, 1); // "1,234.6"
Number.format(1000000); // "1,000,000.00"
Number.format(42, 0); // "42"
```

#### Number.ordinal(num: number): string

Converts a number to its ordinal string representation (1st, 2nd, 3rd, etc.).

```ts
import { Number } from "@devbro/neko-helper";

Number.ordinal(1); // "1st"
Number.ordinal(2); // "2nd"
Number.ordinal(3); // "3rd"
Number.ordinal(21); // "21st"
Number.ordinal(101); // "101st"
```

#### Number.parse(str: string | number | undefined): number | undefined

Parses a string or number to extract a numeric value. Returns undefined if parsing fails. Properly handles zero values.

```ts
import { Number } from "@devbro/neko-helper";

Number.parse("123"); // 123
Number.parse("123.45"); // 123.45
Number.parse("-42"); // -42
Number.parse("1,234"); // 1234
Number.parse("0"); // 0
Number.parse(0); // 0
Number.parse(42); // 42
Number.parse("not a number"); // undefined
Number.parse(""); // undefined
```

#### Number.spell(num: number): string

Converts a number to its written English word representation.

```ts
import { Number } from "@devbro/neko-helper";

Number.spell(42); // "forty-two"
Number.spell(100); // "one hundred"
Number.spell(1001); // "one thousand one"
Number.spell(-5); // "minus five"
Number.spell(0); // "zero"
```

#### Number.spellOrdinal(num: number): string

Converts a number to its written English ordinal word representation.

```ts
import { Number } from "@devbro/neko-helper";

Number.spellOrdinal(1); // "first"
Number.spellOrdinal(2); // "second"
Number.spellOrdinal(3); // "third"
Number.spellOrdinal(21); // "twenty-first"
Number.spellOrdinal(100); // "one hundredth"
```

## Array Helpers

#### intersperse`<T, S>`(arr: T[], sep: S): (T | S)[]

Intersperses a separator element between each element of an array.

```ts
import { Number } from "@devbro/neko-helper";

Number.intersperse([1, 2, 3], 0); // [1, 0, 2, 0, 3]
Number.intersperse(["a", "b", "c"], "-"); // ['a', '-', 'b', '-', 'c']
```

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

class MailerProviderFactory extends FlexibleFactory<Mailer> {}

MailerProviderFactory.register("smtp", (config) => new SmtpMailer(config));
MailerProviderFactory.register(
  "sendgrid",
  (config) => new SendgridMailer(config),
);

const mailer = MailerProviderFactory.create("smtp", {
  host: "smtp.example.com",
});
```
