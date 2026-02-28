# @devbro/neko-helper

A comprehensive collection of utility functions and classes for common programming tasks in Node.js and TypeScript applications. Includes array manipulation, number formatting, cryptographic operations, event handling, async utilities, and more.

[![npm version](https://badge.fury.io/js/%40devbro%2Fneko-helper.svg)](https://www.npmjs.com/package/@devbro/neko-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Modules](#modules)
  - [Array Utilities](#array-utilities)
  - [Number Utilities](#number-utilities)
  - [Encoding & Cryptography](#encoding--cryptography)
  - [Time Utilities](#time-utilities)
  - [Event Management](#event-management)
  - [Pattern Enforcers](#pattern-enforcers)
  - [Types](#types)
- [API Reference](#api-reference)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [TypeScript Support](#typescript-support)
- [Contributing](#contributing)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @devbro/neko-helper
```

## Features

- **Array Operations**: Intersperse, flatten, cross join, chunking, grouping, and more
- **Number Formatting**: Currency, file sizes, abbreviations, ordinals, Roman numerals
- **Cryptography**: Hashing (MD5, SHA-1/256/512, SHA3), JWT, bcrypt, Ed25519 signatures
- **Time Utilities**: Sleep/delay functions for async operations
- **Event Management**: Type-safe event emitters with async support
- **Pattern Enforcers**: Singleton pattern, repeaters, function chaining
- **Environment**: Safe environment variable access with defaults
- **Type Definitions**: JSON types, utility types for TypeScript
- **Zero Config**: Import and use immediately
- **Fully Typed**: Complete TypeScript support with generics
- **Tree Shakeable**: Use only what you need

## Quick Start

```typescript
import { Arr, Num, Enc, sleep, getEnv } from '@devbro/neko-helper';

// Array operations
const chunks = Arr.chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]

// Number formatting
const formatted = Num.abbreviate(1500000);
// "1.5M"

const currency = Num.currencyFormat(1234.56, 'USD');
// "$1,234.56"

// Hashing
const hash = Enc.hash.sha256('password');
// "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"

// JWT
const token = await Enc.jwt.sign({ userId: 123 }, 'secret');
const payload = await Enc.jwt.verify(token, 'secret');

// Async delay
await sleep(1000); // Wait 1 second

// Environment variables
const apiKey = getEnv('API_KEY', 'default-key');
```

## Modules

### Array Utilities

Import: `import { Arr } from '@devbro/neko-helper';`


#### `Arr.evaluateAllBranches(obj: Record<string, any>, func: (node: any) => any): Promise<Record<string, any>>`

Recursively traverses an object or array and applies an async function to all branches (objects and arrays), returning a new object with the transformed branches. Leaves primitive values unchanged.

```typescript
const input = {
  a: 1,
  b: {
    c: 2,
    d: [3, 4]
  }
};

const result = await Arr.evaluateAllBranches(input, async (branch) => {
  if (Array.isArray(branch)) return branch.reverse();
  return branch;
});
// result:
// {
//   a: 1,
//   b: {
//     c: 2,
//     d: [4, 3]
//   }
// }
```

**Use Cases:**
- Transforming or validating all nested arrays/objects in a data structure
- Recursively applying a normalization or filtering function
- Preparing deeply nested data for serialization or API output

---
#### `Arr.intersperse<T, S>(arr: T[], sep: S): (T | S)[]`

Insert a separator between array elements.

```typescript
Arr.intersperse([1, 2, 3], 0);
// [1, 0, 2, 0, 3]

Arr.intersperse(['a', 'b', 'c'], '-');
// ['a', '-', 'b', '-', 'c']
```

#### `Arr.flatten<T>(arr: T[][]): T[]`

Flatten a nested array by one level.

```typescript
Arr.flatten([[1, 2], [3, 4], [5]]);
// [1, 2, 3, 4, 5]
```

#### `Arr.crossJoin<T, U>(arr1: T[], arr2: U[]): [T, U][]`

Create all combinations of two arrays (Cartesian product).

```typescript
Arr.crossJoin([1, 2], ['a', 'b']);
// [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
```

#### `Arr.chunk<T>(arr: T[], size: number): T[][]`

Split array into chunks of specified size.

```typescript
Arr.chunk([1, 2, 3, 4, 5], 2);
// [[1, 2], [3, 4], [5]]
```

#### `Arr.unique<T>(arr: T[]): T[]`

Remove duplicate values from array.

```typescript
Arr.unique([1, 2, 2, 3, 3, 3]);
// [1, 2, 3]
```

#### `Arr.groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]>`

Group array elements by key or function result.

```typescript
const users = [
  { name: 'John', role: 'admin' },
  { name: 'Jane', role: 'user' },
  { name: 'Bob', role: 'admin' },
];

Arr.groupBy(users, 'role');
// {
//   admin: [{ name: 'John', role: 'admin' }, { name: 'Bob', role: 'admin' }],
//   user: [{ name: 'Jane', role: 'user' }]
// }
```

### Number Utilities

Import: `import { Num } from '@devbro/neko-helper';`

#### `Num.abbreviate(num: number): string`

Abbreviate large numbers with K, M, B, T suffixes.

```typescript
Num.abbreviate(1000); // "1K"
Num.abbreviate(1500); // "1.5K"
Num.abbreviate(1000000); // "1M"
Num.abbreviate(2500000); // "2.5M"
Num.abbreviate(1000000000); // "1B"
```

#### `Num.clamp(num: number, min: number, max: number): number`

Clamp number between min and max values.

```typescript
Num.clamp(5, 1, 10); // 5
Num.clamp(-5, 1, 10); // 1
Num.clamp(15, 1, 10); // 10
```

#### `Num.currencyFormat(num: number, currency?: string): string`

Format number as currency.

```typescript
Num.currencyFormat(1234.56); // "$1,234.56"
Num.currencyFormat(1234.56, 'EUR'); // "€1,234.56"
Num.currencyFormat(1234.56, 'GBP'); // "£1,234.56"
```

#### `Num.fileSize(bytes: number): string`

Format bytes to human-readable file size.

```typescript
Num.fileSize(1024); // "1 KB"
Num.fileSize(1048576); // "1 MB"
Num.fileSize(1073741824); // "1 GB"
Num.fileSize(1536); // "1.5 KB"
```

#### `Num.ordinal(num: number): string`

Convert number to ordinal string.

```typescript
Num.ordinal(1); // "1st"
Num.ordinal(2); // "2nd"
Num.ordinal(3); // "3rd"
Num.ordinal(4); // "4th"
Num.ordinal(21); // "21st"
```

#### `Num.toWords(num: number): string`

Convert number to words.

```typescript
Num.toWords(42); // "forty-two"
Num.toWords(1234); // "one thousand, two hundred thirty-four"
```

#### `Num.toRoman(num: number): string`

Convert number to Roman numerals.

```typescript
Num.toRoman(9); // "IX"
Num.toRoman(42); // "XLII"
Num.toRoman(1994); // "MCMXCIV"
```

#### `Num.percentage(value: number, total: number, decimals?: number): string`

Calculate percentage.

```typescript
Num.percentage(25, 100); // "25%"
Num.percentage(33, 100, 2); // "33.00%"
Num.percentage(1, 3, 2); // "33.33%"
```

### Encoding & Cryptography

Import: `import { Enc } from '@devbro/neko-helper';`

#### Hash Functions

```typescript
// MD5
Enc.hash.md5('hello world');
// "5eb63bbbe01eeed093cb22bb8f5acdc3"

// SHA-1
Enc.hash.sha1('hello world');
// "2aae6c35c94fcfb415dbe95f408b9ce91ee846ed"

// SHA-256
Enc.hash.sha256('hello world');
// "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

// SHA-512
Enc.hash.sha512('hello world');
// "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee..."

// SHA3-256
Enc.hash.sha3_256('hello world');
// "644bcc7e564373040999aac89e7622f3ca71fba1..."

// SHA3-512
Enc.hash.sha3_512('hello world');
// "840006653e9ac9e95117a15c915caab81662918e..."
```

#### JWT Operations

```typescript
// Sign JWT
const token = await Enc.jwt.sign({ userId: 123, role: 'admin' }, 'secret-key', { expiresIn: '1h' });

// Verify JWT
const payload = await Enc.jwt.verify(token, 'secret-key');
// { userId: 123, role: 'admin', iat: ..., exp: ... }

// Decode JWT (without verification)
const decoded = Enc.jwt.decode(token);
```

#### Bcrypt Password Hashing

```typescript
// Hash password
const hash = await Enc.bcrypt.encrypt('password123');
// "$2a$10$..."

// Verify password
const isValid = await Enc.bcrypt.compare('password123', hash);
// true

// Check if string is bcrypt hash
Enc.bcrypt.isHash(hash);
// true
```

#### Ed25519 Signatures

```typescript
// Generate key pair
const privateKey = Enc.ed25519.generatePrivateKey();
const publicKey = await Enc.ed25519.getPublicKey(privateKey);

// Sign message
const message = 'Hello, World!';
const signature = await Enc.ed25519.sign(message, privateKey);

// Verify signature
const isValid = await Enc.ed25519.verify(signature, message, publicKey);
// true
```

#### Random Generation

```typescript
// Random bytes
const bytes = Enc.random.bytes(32);
// <Buffer ...>

// Random hex string
const hex = Enc.random.hex(16);
// "a1b2c3d4e5f6..."

// Random UUID v4
const uuid = Enc.random.uuid();
// "550e8400-e29b-41d4-a716-446655440000"
```

#### Base64 Encoding

```typescript
// Encode to base64
const encoded = Enc.base64.encode('Hello, World!');
// "SGVsbG8sIFdvcmxkIQ=="

// Decode from base64
const decoded = Enc.base64.decode(encoded);
// "Hello, World!"

// URL-safe base64
const urlSafe = Enc.base64.encodeUrl('Hello, World!');
const urlDecoded = Enc.base64.decodeUrl(urlSafe);
```

### Time Utilities

#### `sleep(ms: number): Promise<void>`

Async delay function.

```typescript
import { sleep } from '@devbro/neko-helper';

console.log('Starting...');
await sleep(1000); // Wait 1 second
console.log('Done!');

// Use in async loops
for (const item of items) {
  await processItem(item);
  await sleep(100); // 100ms delay between items
}
```

### Event Management

Type-safe event emitters with async support.

#### EventManager

```typescript
import { EventManager } from '@devbro/neko-helper';

type Events = ['userCreated', 'userDeleted', 'userUpdated'];

const events = new EventManager<Events>();

// Register event listeners
events.on('userCreated', (user) => {
  console.log('User created:', user);
});

events.on('userCreated', async (user) => {
  await sendWelcomeEmail(user);
});

// Emit events
await events.emit('userCreated', { id: 1, name: 'John' });

// Remove listener
const handler = (user) => console.log(user);
events.on('userCreated', handler);
events.off('userCreated', handler);
```

#### EventEmittorBase

Base class for creating event-driven classes.

```typescript
import { EventEmittorBase } from '@devbro/neko-helper';

type UserEvents = ['login', 'logout', 'register'];

class UserService extends EventEmittorBase<UserEvents> {
  async login(email: string, password: string) {
    // Authentication logic
    const user = { id: 1, email };

    await this.emit('login', user);
    return user;
  }

  async logout(userId: number) {
    await this.emit('logout', userId);
  }
}

const userService = new UserService();

userService.on('login', (user) => {
  console.log('User logged in:', user.email);
});

await userService.login('user@example.com', 'password');
```

### Pattern Enforcers

#### Singleton Pattern

```typescript
import { createSingleton } from '@devbro/neko-helper';

class Database {
  constructor(public connectionString: string) {
    console.log('Database connected:', connectionString);
  }
}

const getDatabase = createSingleton((label: string, connStr: string) => {
  return new Database(connStr);
});

// Get singleton instance
const db1 = getDatabase('default', 'postgres://...');
const db2 = getDatabase('default', 'postgres://...');
console.log(db1 === db2); // true (same instance)

// Different label, different instance
const db3 = getDatabase('cache', 'redis://...');
console.log(db1 === db3); // false (different label)
```

#### Repeater Pattern

```typescript
import { createRepeater } from '@devbro/neko-helper';

const repeater = createRepeater(() => {
  console.log('Running task...');
  // Your periodic task
}, 5000); // Run every 5 seconds

repeater.start(); // Start repeating
// ... task runs every 5 seconds ...
repeater.stop(); // Stop repeating
```

#### Function Chaining

```typescript
import { chainer } from '@devbro/neko-helper';

const add = (x: number, y: number, z: number) => x + y + z;
const multiply = (x: number, y: number) => x * y;
const divide = (x: number, y: number) => x / y;

const result = await chainer(10)
  .step(add, 5, 3) // 10 + 5 + 3 = 18
  .step(multiply, 2) // 18 * 2 = 36
  .step(divide, 4); // 36 / 4 = 9

console.log(result); // 9

// Works with async functions
const fetchUser = async (id: number) => ({ id, name: 'John' });
const sendEmail = async (user: any) => ({ sent: true, to: user.name });

const emailResult = await chainer(123).step(fetchUser).step(sendEmail);

console.log(emailResult); // { sent: true, to: 'John' }
```

#### Class Detection

```typescript
import { isClass } from '@devbro/neko-helper';

class MyClass {}
function myFunction() {}
const myArrow = () => {};

isClass(MyClass); // true
isClass(myFunction); // false
isClass(myArrow); // false
isClass({}); // false
```

### FlexibleFactory

Factory pattern for dynamic object creation.

```typescript
import { FlexibleFactory } from '@devbro/neko-helper';

interface Animal {
  speak(): string;
}

const animalFactory = new FlexibleFactory<Animal>();

// Register constructors
animalFactory.register('dog', (name: string) => ({
  speak: () => `${name} says Woof!`,
}));

animalFactory.register('cat', (name: string) => ({
  speak: () => `${name} says Meow!`,
}));

// Create instances
const dog = animalFactory.create<Animal>('dog', 'Buddy');
console.log(dog.speak()); // "Buddy says Woof!"

const cat = animalFactory.create<Animal>('cat', 'Whiskers');
console.log(cat.speak()); // "Whiskers says Meow!"
```

### Environment Variables

#### `getEnv(key: string, defaultValue?: any): string`

Safely access environment variables with optional defaults.

```typescript
import { getEnv } from '@devbro/neko-helper';

// With default value
const apiKey = getEnv('API_KEY', 'default-api-key');

// Without default (throws if not set)
const dbUrl = getEnv('DATABASE_URL');
// Throws: "process.env.DATABASE_URL is not defined"

// Usage in configuration
const config = {
  port: parseInt(getEnv('PORT', '3000')),
  host: getEnv('HOST', '0.0.0.0'),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  apiKey: getEnv('API_KEY'),
};
```

### Types

Utility types for TypeScript.

```typescript
import type { JSONValue, JSONObject, JSONArray } from '@devbro/neko-helper';

// JSON-compatible types
const data: JSONObject = {
  name: 'John',
  age: 30,
  active: true,
  tags: ['user', 'admin'],
  metadata: {
    created: '2026-01-31',
    updated: null,
  },
};

const items: JSONArray = [1, 'two', true, null, { key: 'value' }];

const value: JSONValue = 'can be any JSON-compatible value';
```

## API Reference

### Array Module (`Arr`)

- `intersperse<T, S>(arr: T[], sep: S): (T | S)[]`
- `flatten<T>(arr: T[][]): T[]`
- `crossJoin<T, U>(arr1: T[], arr2: U[]): [T, U][]`
- `chunk<T>(arr: T[], size: number): T[][]`
- `unique<T>(arr: T[]): T[]`
- `groupBy<T>(arr: T[], key: keyof T | Function): Record<string, T[]>`
- `difference<T>(arr1: T[], arr2: T[]): T[]`
- `intersection<T>(arr1: T[], arr2: T[]): T[]`
- `shuffle<T>(arr: T[]): T[]`
- `sample<T>(arr: T[]): T`
- `sum(arr: number[]): number`
- `average(arr: number[]): number`
 - `evaluateAllBranches(obj: Record<string, any>, func: (node: any) => any): Promise<Record<string, any>>`

### Number Module (`Num`)

- `abbreviate(num: number): string`
- `clamp(num: number, min: number, max: number): number`
- `currencyFormat(num: number, currency?: string): string`
- `fileSize(bytes: number): string`
- `ordinal(num: number): string`
- `toWords(num: number): string`
- `toRoman(num: number): string`
- `percentage(value: number, total: number, decimals?: number): string`
- `random(min: number, max: number): number`
- `round(num: number, decimals: number): number`

### Encoding Module (`Enc`)

#### Hash

- `hash.md5(data: string): string`
- `hash.sha1(data: string): string`
- `hash.sha256(data: string): string`
- `hash.sha512(data: string): string`
- `hash.sha3_256(data: string): string`
- `hash.sha3_512(data: string): string`

#### JWT

- `jwt.sign(payload: object, secret: string, options?: SignOptions): Promise<string>`
- `jwt.verify(token: string, secret: string, options?: VerifyOptions): Promise<object>`
- `jwt.decode(token: string, options?: DecodeOptions): object | null`

#### Bcrypt

- `bcrypt.encrypt(password: string): Promise<string>`
- `bcrypt.compare(password: string, hash: string): Promise<boolean>`
- `bcrypt.isHash(str: string): boolean`

#### Ed25519

- `ed25519.generatePrivateKey(): Uint8Array`
- `ed25519.getPublicKey(privateKey: Uint8Array): Promise<Uint8Array>`
- `ed25519.sign(message: string, privateKey: Uint8Array): Promise<Uint8Array>`
- `ed25519.verify(signature: Uint8Array, message: string, publicKey: Uint8Array): Promise<boolean>`

#### Random

- `random.bytes(size: number): Buffer`
- `random.hex(size: number): string`
- `random.uuid(): string`

#### Base64

- `base64.encode(data: string): string`
- `base64.decode(data: string): string`
- `base64.encodeUrl(data: string): string`
- `base64.decodeUrl(data: string): string`

### Event Management

- `EventManager<T>` - Event manager with typed events
- `EventEmittorBase<T>` - Base class for event-driven classes

### Pattern Enforcers

- `createSingleton<T>(func: Function): Function`
- `createRepeater(fn: Function, interval: number): { start, stop }`
- `chainer<T>(initial: T): Chainer<T>`
- `isClass(variable: any): boolean`

### Utilities

- `sleep(ms: number): Promise<void>`
- `getEnv(key: string, defaultValue?: any): string`
- `FlexibleFactory<T>` - Factory pattern implementation

## Real-World Examples

### API Response Formatting

```typescript
import { Num, Arr } from '@devbro/neko-helper';

function formatUserResponse(users: any[]) {
  return {
    data: users.map((user) => ({
      ...user,
      joinDate: user.joinDate.toISOString(),
      storageUsed: Num.fileSize(user.storageBytes),
      reputation: Num.abbreviate(user.reputationPoints),
    })),
    stats: {
      total: users.length,
      byRole: Arr.groupBy(users, 'role'),
    },
  };
}
```

### Secure Authentication

```typescript
import { Enc } from '@devbro/neko-helper';

class AuthService {
  async register(email: string, password: string) {
    // Hash password with bcrypt
    const hashedPassword = await Enc.bcrypt.encrypt(password);

    const user = await db.users.create({
      email,
      password: hashedPassword,
    });

    // Generate JWT
    const token = await Enc.jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await db.users.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await Enc.bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = await Enc.jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { user, token };
  }

  async verifyToken(token: string) {
    try {
      const payload = await Enc.jwt.verify(token, process.env.JWT_SECRET!);
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```

### Batch Processing with Delays

```typescript
import { Arr, sleep } from '@devbro/neko-helper';

async function processBatch(items: any[], batchSize: number = 10) {
  const chunks = Arr.chunk(items, batchSize);

  for (const [index, chunk] of chunks.entries()) {
    console.log(`Processing batch ${index + 1}/${chunks.length}`);

    await Promise.all(chunk.map(processItem));

    // Delay between batches to avoid rate limiting
    if (index < chunks.length - 1) {
      await sleep(1000); // 1 second delay
    }
  }
}
```

### Event-Driven User Service

```typescript
import { EventEmittorBase } from '@devbro/neko-helper';

type UserEvents = ['created', 'updated', 'deleted', 'login', 'logout'];

class UserService extends EventEmittorBase<UserEvents> {
  async create(data: any) {
    const user = await db.users.create(data);
    await this.emit('created', user);
    return user;
  }

  async update(id: number, data: any) {
    const user = await db.users.update(id, data);
    await this.emit('updated', user);
    return user;
  }

  async delete(id: number) {
    await db.users.delete(id);
    await this.emit('deleted', id);
  }

  async login(email: string, password: string) {
    const user = await authenticate(email, password);
    await this.emit('login', user);
    return user;
  }
}

// Usage
const userService = new UserService();

// Register event handlers
userService.on('created', async (user) => {
  await sendWelcomeEmail(user);
});

userService.on('login', async (user) => {
  await logLoginActivity(user);
  await updateLastLoginTimestamp(user);
});

userService.on('deleted', async (userId) => {
  await cleanupUserData(userId);
});
```

### Configuration Management

```typescript
import { getEnv, createSingleton } from '@devbro/neko-helper';

interface AppConfig {
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  redis: {
    host: string;
    port: number;
  };
}

const getConfig = createSingleton(
  (): AppConfig => ({
    port: parseInt(getEnv('PORT', '3000')),
    host: getEnv('HOST', '0.0.0.0'),
    database: {
      host: getEnv('DB_HOST', 'localhost'),
      port: parseInt(getEnv('DB_PORT', '5432')),
      name: getEnv('DB_NAME', 'myapp'),
      user: getEnv('DB_USER', 'postgres'),
      password: getEnv('DB_PASSWORD'),
    },
    jwt: {
      secret: getEnv('JWT_SECRET'),
      expiresIn: getEnv('JWT_EXPIRES_IN', '7d'),
    },
    redis: {
      host: getEnv('REDIS_HOST', 'localhost'),
      port: parseInt(getEnv('REDIS_PORT', '6379')),
    },
  })
);

// Use singleton config
const config = getConfig();
console.log(`Server will run on ${config.host}:${config.port}`);
```

### Data Processing Pipeline

```typescript
import { chainer, Arr, Num } from '@devbro/neko-helper';

interface User {
  id: number;
  name: string;
  age: number;
  purchases: number[];
}

async function processUserData(userId: number) {
  const result = await chainer(userId)
    .step(fetchUser)
    .step(calculateTotalSpent)
    .step(determineUserTier)
    .step(sendPersonalizedOffer);

  return result;
}

async function fetchUser(id: number): Promise<User> {
  return await db.users.findById(id);
}

function calculateTotalSpent(user: User): User & { totalSpent: number } {
  return {
    ...user,
    totalSpent: Arr.sum(user.purchases),
  };
}

function determineUserTier(user: User & { totalSpent: number }): User & { tier: string } {
  const tier = user.totalSpent > 10000 ? 'gold' : user.totalSpent > 5000 ? 'silver' : 'bronze';

  return { ...user, tier };
}

async function sendPersonalizedOffer(user: User & { tier: string }) {
  const discount = user.tier === 'gold' ? 0.2 : user.tier === 'silver' ? 0.1 : 0.05;

  await sendEmail(user, `Exclusive ${Num.percentage(discount * 100, 100)} off!`);

  return { sent: true, tier: user.tier, discount };
}
```

## Best Practices

### 1. Use Namespaced Imports

```typescript
// ✅ Good: Clear what module each function comes from
import { Arr, Num, Enc } from '@devbro/neko-helper';

const chunks = Arr.chunk(data, 10);
const formatted = Num.abbreviate(total);
const hash = Enc.hash.sha256(password);

// ❌ Avoid: Less clear where functions come from
import { chunk, abbreviate, hash } from '@devbro/neko-helper';
```

### 2. Type Your Event Emitters

```typescript
// ✅ Good: Type-safe events
type AppEvents = ['start', 'stop', 'error'];
const events = new EventManager<AppEvents>();

events.on('start', () => {}); // OK
events.on('invalid', () => {}); // TypeScript error

// ❌ Bad: No type safety
const events = new EventManager<any>();
```

### 3. Use Environment Defaults Wisely

```typescript
// ✅ Good: Provide sensible defaults for optional config
const port = parseInt(getEnv('PORT', '3000'));
const logLevel = getEnv('LOG_LEVEL', 'info');

// ✅ Good: No default for required secrets
const apiKey = getEnv('API_KEY'); // Throws if not set

// ❌ Bad: Default for sensitive data
const jwtSecret = getEnv('JWT_SECRET', 'default-secret');
```

### 4. Handle Async Errors in Event Handlers

```typescript
// ✅ Good: Proper error handling
events.on('userCreated', async (user) => {
  try {
    await sendEmail(user);
  } catch (error) {
    logger.error('Failed to send email', error);
  }
});

// ❌ Bad: Unhandled promise rejection
events.on('userCreated', async (user) => {
  await sendEmail(user); // Could throw
});
```

### 5. Use Appropriate Hash Functions

```typescript
// ✅ Good: bcrypt for passwords
const hashedPassword = await Enc.bcrypt.encrypt(password);

// ✅ Good: SHA-256 for data integrity
const checksum = Enc.hash.sha256(fileContent);

// ❌ Bad: MD5/SHA-1 for security (use SHA-256+)
const hash = Enc.hash.md5(password); // Not secure enough
```

## TypeScript Support

All utilities are fully typed with TypeScript generics for maximum type safety.

```typescript
import { Arr, Num, EventManager, FlexibleFactory } from '@devbro/neko-helper';

// Generic array operations
const numbers: number[] = [1, 2, 3, 4, 5];
const chunks: number[][] = Arr.chunk(numbers, 2);

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user';
}

const users: User[] = [...];
const grouped: Record<string, User[]> = Arr.groupBy(users, 'role');

// Type-safe events
type OrderEvents = ['created', 'shipped', 'delivered'];
const orderEvents = new EventManager<OrderEvents>();

orderEvents.on('created', (order: Order) => {
  // order is typed
});

// Type-safe factory
interface Shape {
  area(): number;
}

const shapeFactory = new FlexibleFactory<Shape>();
shapeFactory.register('circle', (radius: number) => ({
  area: () => Math.PI * radius * radius
}));

const circle = shapeFactory.create<Shape>('circle', 5);
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/devbro1/pashmak.git
cd pashmak/neko-helper

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Related Packages

- [@devbro/neko-context](https://www.npmjs.com/package/@devbro/neko-context) - Async context management
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging utilities
- [@devbro/neko-http](https://www.npmjs.com/package/@devbro/neko-http) - HTTP server utilities
- [@devbro/neko-router](https://www.npmjs.com/package/@devbro/neko-router) - HTTP routing
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework

## License

MIT

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/devbro1/pashmak/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devbro1/pashmak/discussions)
- 📖 Documentation: [https://devbro1.github.io/pashmak/](https://devbro1.github.io/pashmak/)
