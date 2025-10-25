---
sidebar_position: 4
---

# Helpers

Set of useful helper functions.

## Encryption and Hashing Helpers

All encryption, hashing, and cryptographic utilities are available under the `Enc` namespace:

```ts
import { Enc } from "@devbro/neko-helper";

// Usage examples
const hash = Enc.hash.sha256("hello world");
const encrypted = await Enc.password.encryptPassword("myPassword");
const token = Enc.jwt.sign({ userId: 123 }, "secret");
```

### Hash Functions (Enc.hash)

The `Enc.hash` namespace provides common cryptographic hashing algorithms.

#### Enc.hash.md5(data: string): string

Generates an MD5 hash of the input string.

```ts
Enc.hash.md5("hello world");
// Returns: '5eb63bbbe01eeed093cb22bb8f5acdc3'
```

#### Enc.hash.sha1(data: string): string

Generates a SHA-1 hash of the input string.

```ts
Enc.hash.sha1("hello world");
// Returns: '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed'
```

#### Enc.hash.sha256(data: string): string

Generates a SHA-256 hash of the input string.

```ts
Enc.hash.sha256("hello world");
// Returns: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
```

#### Enc.hash.sha512(data: string): string

Generates a SHA-512 hash of the input string.

```ts
Enc.hash.sha512("hello world");
// Returns: '309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f...'
```

#### Enc.hash.sha3_256(data: string): string

Generates a SHA3-256 hash of the input string.

```ts
Enc.hash.sha3_256("hello world");
// Returns: '644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938'
```

#### Enc.hash.sha3_512(data: string): string

Generates a SHA3-512 hash of the input string.

```ts
Enc.hash.sha3_512("hello world");
// Returns: '840006653e9ac9e95117a15c915caab81662918e925de9e004f774ff82d7079a...'
```

### Password Management (Enc.password)

The `Enc.password` namespace provides bcrypt-based password hashing utilities.

#### Enc.password.isBcryptHash(str: string): boolean

Checks if a string is a valid bcrypt hash. Supports $2a, $2b, and $2y versions.

```ts
Enc.password.isBcryptHash(
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
);
// Returns: true

Enc.password.isBcryptHash("not a hash");
// Returns: false
```

#### Enc.password.encryptPassword(password: string, rounds?: number): Promise`<string>`

Encrypts a password using bcrypt. Default rounds is 10.

```ts
const hash = await Enc.password.encryptPassword("mySecurePassword");
// Returns: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

// With custom rounds
const hash = await Enc.password.encryptPassword("myPassword", 12);
```

#### Enc.password.comparePassword(password: string, hash: string): Promise`<boolean>`

Compares a plain text password with a bcrypt hash.

```ts
const isMatch = await Enc.password.comparePassword("myPassword", hash);
// Returns: true or false
```

### Key Generation (Enc.keys)

The `Enc.keys` namespace provides cryptographic key pair generation.

#### Enc.keys.rsa(modulusLength?: number): { publicKey: string; privateKey: string }

Generates an RSA key pair. Default modulus length is 2048 bits.

```ts
const { publicKey, privateKey } = Enc.keys.rsa();
// Returns PEM-formatted keys

// With custom modulus length
const keys = Enc.keys.rsa(4096);
```

#### Enc.keys.ed25519(): Promise`<{ publicKey: string; privateKey: string }>`

Generates an Ed25519 key pair for modern cryptography.

```ts
const { publicKey, privateKey } = await Enc.keys.ed25519();
// Returns hex-encoded keys (64 characters each)
```

### JWT Operations (Enc.jwt)

The `Enc.jwt` namespace provides JSON Web Token utilities.

#### Enc.jwt.sign(payload: string | object | Buffer, secret: string, options?: SignOptions): string

Signs a JWT with the provided payload and secret.

```ts
const token = Enc.jwt.sign({ userId: 123, name: "John" }, "mySecret");
// Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// With expiration
const token = Enc.jwt.sign({ userId: 123 }, "secret", { expiresIn: "1h" });

// With algorithm
const token = Enc.jwt.sign({ data: "test" }, "secret", { algorithm: "HS256" });
```

#### Enc.jwt.verify(token: string, secret: string, options?: VerifyOptions): string | JwtPayload

Verifies a JWT token and returns the decoded payload. Throws an error if verification fails.

```ts
try {
  const payload = Enc.jwt.verify(token, "mySecret");
  console.log(payload); // { userId: 123, iat: 1234567890, exp: 1234571490 }
} catch (err) {
  console.error("Invalid token");
}
```

#### Enc.jwt.decode(token: string, options?: DecodeOptions): null | string | JwtPayload

Decodes a JWT token without verifying its signature.

```ts
const payload = Enc.jwt.decode(token);
// Returns decoded payload or null if invalid
```

### Digital Signatures (Enc.sign)

The `Enc.sign` namespace provides Ed25519 signature operations.

#### Enc.sign.ed25519(privateKey: string, data: string): Promise`<string>`

Signs data using an Ed25519 private key.

```ts
const { privateKey } = await Enc.keys.ed25519();
const signature = await Enc.sign.ed25519(privateKey, "message to sign");
// Returns: hex-encoded signature (128 characters)
```

#### Enc.sign.verifyEd25519(publicKey: string, signature: string, data: string): Promise`<boolean>`

Verifies an Ed25519 signature.

```ts
const { publicKey, privateKey } = await Enc.keys.ed25519();
const signature = await Enc.sign.ed25519(privateKey, "message");
const isValid = await Enc.sign.verifyEd25519(publicKey, signature, "message");
// Returns: true or false
```

### Legacy Functions

For backward compatibility, these functions are still available at the root level:

#### getEnv(key: string, defaultValue?: any): any

Get environment variable value by key. If not found, return defaultValue.
If defaultValue is not provided, throw an error.

#### isBcryptHash(str: string): boolean

Check if a string is a valid bcrypt hash. **Deprecated: Use `Enc.password.isBcryptHash()` instead.**

#### encryptPassword(password: string): Promise`<string>`

Encrypt a password using bcrypt. **Deprecated: Use `Enc.password.encryptPassword()` instead.**

#### compareBcrypt(password: string, hash: string): Promise`<boolean>`

Compare a password with a bcrypt hash. **Deprecated: Use `Enc.password.comparePassword()` instead.**

## Time Helpers

#### sleep(ms: number): Promise`<void>`

Sleep for a given number of milliseconds.

## Number Helpers

All number utility functions are available under the `Num` namespace:

```ts
import { Num } from "@devbro/neko-helper";

// Usage examples
Num.abbreviate(1500); // "1.5K"
Num.currencyFormat(1234.56); // "$1,234.56"
Num.fileSize(1024); // "1 KB"
```

#### Num.abbreviate(num: number): string

Abbreviates large numbers with appropriate suffixes (K, M, B, T, etc.).

```ts
import { Num } from "@devbro/neko-helper";

Num.abbreviate(1000); // "1K"
Num.abbreviate(1500); // "1.5K"
Num.abbreviate(1000000); // "1M"
Num.abbreviate(2500000); // "2.5M"
```

#### Num.clamp(num: number, min: number, max: number): number

Clamps a number between minimum and maximum values.

```ts
import { Num } from "@devbro/neko-helper";

Num.clamp(5, 1, 10); // 5
Num.clamp(-5, 1, 10); // 1
Num.clamp(15, 1, 10); // 10
```

#### Num.currencyFormat(num: number, currency?: string): string

Formats a number as currency with proper locale formatting. Default currency is USD.

```ts
import { Num } from "@devbro/neko-helper";

Num.currencyFormat(1234.56); // "$1,234.56"
Num.currencyFormat(1234.56, "EUR"); // "€1,234.56"
Num.currencyFormat(1000, "GBP"); // "£1,000.00"
```

#### Num.fileSize(num: number): string

Formats a number of bytes into a human-readable file size string.

```ts
import { Num } from "@devbro/neko-helper";

Num.fileSize(1024); // "1 KB"
Num.fileSize(1536); // "1.5 KB"
Num.fileSize(1048576); // "1 MB"
Num.fileSize(500); // "500 B"
```

#### Num.format(num: number, decimalPlaces?: number): string

Formats a number with specified decimal places and thousands separators. Default is 2 decimal places.

```ts
import { Num } from "@devbro/neko-helper";

Num.format(1234.5678); // "1,234.57"
Num.format(1234.5678, 1); // "1,234.6"
Num.format(1000000); // "1,000,000.00"
Num.format(42, 0); // "42"
```

#### Num.ordinal(num: number): string

Converts a number to its ordinal string representation (1st, 2nd, 3rd, etc.).

```ts
import { Num } from "@devbro/neko-helper";

Num.ordinal(1); // "1st"
Num.ordinal(2); // "2nd"
Num.ordinal(3); // "3rd"
Num.ordinal(21); // "21st"
Num.ordinal(101); // "101st"
```

#### Num.parse(str: string | number | undefined): number | undefined

Parses a string or number to extract a numeric value. Returns undefined if parsing fails. Properly handles zero values.

```ts
import { Num } from "@devbro/neko-helper";

Num.parse("123"); // 123
Num.parse("123.45"); // 123.45
Num.parse("-42"); // -42
Num.parse("1,234"); // 1234
Num.parse("0"); // 0
Num.parse(0); // 0
Num.parse(42); // 42
Num.parse("not a number"); // undefined
Num.parse(""); // undefined
```

#### Num.spell(num: number): string

Converts a number to its written English word representation.

```ts
import { Num } from "@devbro/neko-helper";

Num.spell(42); // "forty-two"
Num.spell(100); // "one hundred"
Num.spell(1001); // "one thousand one"
Num.spell(-5); // "minus five"
Num.spell(0); // "zero"
```

#### Num.spellOrdinal(num: number): string

Converts a number to its written English ordinal word representation.

```ts
import { Num } from "@devbro/neko-helper";

Num.spellOrdinal(1); // "first"
Num.spellOrdinal(2); // "second"
Num.spellOrdinal(3); // "third"
Num.spellOrdinal(21); // "twenty-first"
Num.spellOrdinal(100); // "one hundredth"
```

## Array Helpers

All array utility functions are available under the `Arr` namespace:

```ts
import { Arr } from "@devbro/neko-helper";

// Usage examples
Arr.intersperse([1, 2, 3], 0); // [1, 0, 2, 0, 3]
Arr.flatten([
  [1, 2],
  [3, 4],
]); // [1, 2, 3, 4]
Arr.get([1, 2, 3], -1); // 3
```

#### Arr.intersperse`<T, S>`(arr: T[], sep: S): (T | S)[]

Intersperses a separator element between each element of an array.

```ts
Arr.intersperse([1, 2, 3], 0); // [1, 0, 2, 0, 3]
Arr.intersperse(["a", "b", "c"], "-"); // ['a', '-', 'b', '-', 'c']
Arr.intersperse([1], 0); // [1]
Arr.intersperse([], 0); // []
```

#### Arr.flatten`<T>`(arr: T[][]): T[]

Flattens a nested array by one level.

```ts
Arr.flatten([[1, 2], [3, 4], [5]]); // [1, 2, 3, 4, 5]
Arr.flatten([["a", "b"], ["c"], ["d", "e"]]); // ['a', 'b', 'c', 'd', 'e']
Arr.flatten([[], [1, 2], []]); // [1, 2]
```

#### Arr.crossJoin`<T, U>`(arr1: T[], arr2: U[]): [T, U][]

Creates a cross join (Cartesian product) of two arrays.

```ts
Arr.crossJoin([1, 2], ["a", "b"]); // [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
Arr.crossJoin(["x"], [1, 2, 3]); // [['x', 1], ['x', 2], ['x', 3]]
Arr.crossJoin([], [1, 2]); // []
```

#### Arr.get`<T, D>`(arr: T[], index: number, defaultValue?: D): T | D | undefined

Gets an element from an array at the specified index. Supports negative indices to count from the end.

```ts
Arr.get([1, 2, 3, 4], 1); // 2
Arr.get([1, 2, 3, 4], -1); // 4
Arr.get([1, 2, 3], 10, "default"); // 'default'
Arr.get([], 0, "empty"); // 'empty'
```

#### Arr.first`<T, D>`(arr: T[], defaultValue?: D): T | D | undefined

Gets the first element of an array.

```ts
Arr.first([1, 2, 3]); // 1
Arr.first(["a", "b", "c"]); // 'a'
Arr.first([], "default"); // 'default'
Arr.first([]); // undefined
```

#### Arr.last`<T, D>`(arr: T[], defaultValue?: D): T | D | undefined

Gets the last element of an array.

```ts
Arr.last([1, 2, 3]); // 3
Arr.last(["a", "b", "c"]); // 'c'
Arr.last([], "default"); // 'default'
Arr.last([]); // undefined
```

#### Arr.split`<T>`(arr: T[], sizeOrFunc: number | ((item: T, index: number) => boolean)): T[][]

Splits an array into chunks based on size or a predicate function.

```ts
// Split by size
Arr.split([1, 2, 3, 4, 5, 6], 2); // [[1, 2], [3, 4], [5, 6]]
Arr.split([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

// Split by predicate
Arr.split([1, 2, 3, 4, 5, 6], (item) => item % 3 === 0);
// [[1, 2], [3, 4, 5], [6]]
```

#### Arr.random`<T>`(arr: T[]): T | undefined

Returns a random element from an array.

```ts
Arr.random([1, 2, 3, 4, 5]); // any element from array (e.g., 3)
Arr.random(["apple", "banana", "cherry"]); // any string (e.g., 'banana')
Arr.random([]); // undefined
Arr.random(["single"]); // 'single'
```

#### Arr.shuffle`<T>`(arr: T[]): T[]

Returns a new array with elements shuffled in random order using Fisher-Yates algorithm.

```ts
Arr.shuffle([1, 2, 3, 4, 5]); // [3, 1, 5, 2, 4] (random order)
Arr.shuffle(["a", "b", "c"]); // ['c', 'a', 'b'] (random order)
Arr.shuffle([]); // []
Arr.shuffle(["single"]); // ['single']
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
