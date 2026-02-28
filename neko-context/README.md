# @devbro/neko-context

Async context management for Node.js applications - think React Context but for the backend. Run isolated contexts across async operations without sharing memory, perfect for handling concurrent requests with isolated state.

[![npm version](https://badge.fury.io/js/%40devbro%2Fneko-context.svg)](https://www.npmjs.com/package/@devbro/neko-context)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Context Isolation](#context-isolation)
- [Type Safety](#type-safety)
- [Use Cases](#use-cases)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @devbro/neko-context
```

## Features

- **Async Context Isolation**: Each async operation gets its own isolated context
- **Type Safety**: Full TypeScript support with generic types
- **Zero Dependencies**: Built on Node.js AsyncLocalStorage
- **Safe Mode**: `ctxsafe()` for optional context access
- **Nested Contexts**: Support for nested context providers
- **Performance**: Minimal overhead with native async tracking
- **Request Tracking**: Perfect for HTTP request isolation
- **Testing Friendly**: Easy to test with isolated contexts

## Quick Start

### Basic Usage

```typescript
import { ctx, context_provider } from '@devbro/neko-context';

// Run code within a context
await context_provider.run(async () => {
  // Set values in the context
  ctx().set('userId', 123);
  ctx().set('requestId', 'req-abc-123');

  // Access values anywhere in the async chain
  await processRequest();
});

async function processRequest() {
  const userId = ctx().get<number>('userId');
  const requestId = ctx().get<string>('requestId');

  console.log(`Processing request ${requestId} for user ${userId}`);
}
```

### Concurrent Requests Example

```typescript
import { ctx, context_provider } from '@devbro/neko-context';

class Animal {
  constructor(public name: string) {}
}

function groom(): void {
  const animal = ctx().get<Animal>('animal');
  console.log(`Grooming ${animal.name}`);
  ctx().set('end_groom_time', Date.now());
}

function feed(): void {
  const animal = ctx().get<Animal>('animal');
  console.log(`Feeding ${animal.name}`);
}

function play(): void {
  const animal = ctx().get<Animal>('animal');
  console.log(`Playing with ${animal.name}`);
}

const animals = [
  new Animal('Cat'),
  new Animal('Dog'),
  new Animal('Tiger'),
  new Animal('Lion'),
  new Animal('Elephant'),
];

// Each animal gets its own isolated context
for (const animal of animals) {
  await context_provider.run(async (): Promise<void> => {
    ctx().set('animal', animal);
    ctx().set('start_time', Date.now());

    groom();
    feed();
    play();

    console.log('End groom time:', ctx().get<number>('end_groom_time'));
  });
}
```

## Core Concepts

### Context Provider

The `context_provider` creates an isolated context for async operations. All code running within the provider has access to the same context.

```typescript
import { context_provider, ctx } from '@devbro/neko-context';

// Create a new context scope
await context_provider.run(async () => {
  // All code here shares the same context
  ctx().set('key', 'value');

  await someAsyncOperation();

  // Context is still available after async operations
  const value = ctx().get('key');
});

// Context is no longer available here
```

### Context Storage

The context acts as a key-value store that persists across async operations:

```typescript
ctx().set('key', value); // Store a value
const value = ctx().get('key'); // Retrieve a value
const exists = ctx().has('key'); // Check if key exists
ctx().delete('key'); // Remove a value
ctx().clear(); // Clear all values
```

### Safe Context Access

Use `ctxsafe()` when you're unsure if context is available:

```typescript
import { ctx, ctxsafe, context_provider } from '@devbro/neko-context';

function someFunction() {
  // Using ctx() outside provider throws an error
  // const value = ctx().get('key'); // ❌ Throws error

  // Using ctxsafe() returns undefined if no context
  const safeValue = ctxsafe()?.get('key'); // ✅ Returns undefined

  if (safeValue) {
    console.log('Context available:', safeValue);
  } else {
    console.log('No context available');
  }
}

// Outside context provider
someFunction(); // Logs: "No context available"

// Inside context provider
await context_provider.run(async () => {
  ctx().set('key', 'value');
  someFunction(); // Logs: "Context available: value"
});
```

## API Reference

### `context_provider`

#### `run<T>(callback: () => Promise<T>): Promise<T>`

Runs the callback function within a new isolated context.

```typescript
const result = await context_provider.run(async () => {
  ctx().set('data', { id: 1 });
  return await processData();
});
```

### `ctx()`

Returns the current context. Throws an error if called outside a context provider.

#### Methods

##### `set<T>(key: string, value: T): void`

Store a value in the context.

```typescript
ctx().set('userId', 123);
ctx().set('user', { id: 123, name: 'John' });
```

##### `get<T>(key: string): T | undefined`

Retrieve a value from the context.

```typescript
const userId = ctx().get<number>('userId');
const user = ctx().get<User>('user');
```

##### `has(key: string): boolean`

Check if a key exists in the context.

```typescript
if (ctx().has('userId')) {
  const userId = ctx().get<number>('userId');
}
```

##### `delete(key: string): boolean`

Remove a value from the context.

```typescript
ctx().delete('temporaryData');
```

##### `clear(): void`

Remove all values from the context.

```typescript
ctx().clear();
```

### `ctxsafe()`

Returns the current context or `undefined` if no context is available. Safe to call outside a context provider.

```typescript
const context = ctxsafe();

if (context) {
  context.set('key', 'value');
  const value = context.get('key');
}
```

## Context Isolation

Each context provider creates an isolated scope. Changes in one context don't affect others:

```typescript
import { context_provider, ctx } from '@devbro/neko-context';

// Run multiple contexts concurrently
const promises = [1, 2, 3].map(async (id) => {
  return context_provider.run(async () => {
    ctx().set('requestId', id);

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    // Each context maintains its own requestId
    const currentId = ctx().get<number>('requestId');
    console.log(`Context ${currentId}`); // Always matches original id

    return currentId;
  });
});

await Promise.all(promises);
// Output (order may vary):
// Context 1
// Context 2
// Context 3
```

### Nested Contexts

Contexts can be nested, with inner contexts having access to outer context values:

```typescript
await context_provider.run(async () => {
  ctx().set('outer', 'outer value');

  console.log(ctx().get('outer')); // "outer value"

  await context_provider.run(async () => {
    console.log(ctx().get('outer')); // "outer value" (inherited)

    ctx().set('inner', 'inner value');
    console.log(ctx().get('inner')); // "inner value"
  });

  console.log(ctx().get('inner')); // undefined (not inherited back)
});
```

## Type Safety

### Generic Types

Use TypeScript generics for type-safe context values:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

await context_provider.run(async () => {
  // Type-safe set
  ctx().set<User>('user', {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  });

  // Type-safe get
  const user = ctx().get<User>('user');
  console.log(user?.name); // TypeScript knows user is User | undefined
});
```

### Type Guards

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  );
}

const value = ctx().get('user');
if (isUser(value)) {
  console.log(value.name); // TypeScript knows this is safe
}
```

### Strict Context Keys

Define allowed context keys for better type safety:

```typescript
type ContextKey = 'user' | 'requestId' | 'startTime' | 'logger';

function setContext<K extends ContextKey>(key: K, value: any): void {
  ctx().set(key, value);
}

function getContext<K extends ContextKey>(key: K): any {
  return ctx().get(key);
}

// Usage
setContext('user', { id: 1 }); // ✅ Valid
setContext('invalid', 'value'); // ❌ TypeScript error
```

## Use Cases

### HTTP Request Tracking

```typescript
import { context_provider, ctx } from '@devbro/neko-context';
import { createServer } from 'http';

const server = createServer((req, res) => {
  context_provider.run(async () => {
    // Each request gets its own context
    const requestId = generateRequestId();
    ctx().set('requestId', requestId);
    ctx().set('startTime', Date.now());
    ctx().set('method', req.method);
    ctx().set('url', req.url);

    try {
      await handleRequest(req, res);
    } catch (error) {
      await handleError(error, req, res);
    }
  });
});

async function handleRequest(req, res) {
  const requestId = ctx().get<string>('requestId');
  console.log(`[${requestId}] Processing ${req.method} ${req.url}`);

  const data = await fetchData();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleError(error, req, res) {
  const requestId = ctx().get<string>('requestId');
  console.error(`[${requestId}] Error:`, error);

  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Internal Server Error', requestId }));
}
```

### Database Transaction Context

```typescript
import { context_provider, ctx } from '@devbro/neko-context';
import { Database } from '@devbro/neko-sql';

async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return context_provider.run(async () => {
    const db = new Database();
    const transaction = await db.beginTransaction();

    ctx().set('transaction', transaction);

    try {
      const result = await callback();
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
}

// Usage
await withTransaction(async () => {
  const transaction = ctx().get('transaction');

  await transaction.query('INSERT INTO users ...', []);
  await transaction.query('INSERT INTO profiles ...', []);

  // Both queries committed together
});
```

### Logger Context

```typescript
import { context_provider, ctx } from '@devbro/neko-context';
import { logger } from '@devbro/neko-logger';

await context_provider.run(async () => {
  const requestId = generateRequestId();

  // Create logger with context
  const contextLogger = logger.child({ requestId });
  ctx().set('logger', contextLogger);

  await processRequest();
});

async function processRequest() {
  const log = ctx().get('logger');

  log.info('Starting request processing');

  try {
    await doWork();
    log.info('Request completed successfully');
  } catch (error) {
    log.error('Request failed', { error });
  }
}
```

### User Authentication Context

```typescript
import { context_provider, ctx } from '@devbro/neko-context';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'admin' | 'user';
}

// Middleware
async function authenticateRequest(token: string) {
  const user = await verifyToken(token);
  ctx().set('user', user);
  ctx().set('isAuthenticated', true);
}

// Route handlers
function requireAuth() {
  const isAuthenticated = ctx().get<boolean>('isAuthenticated');

  if (!isAuthenticated) {
    throw new Error('Unauthorized');
  }
}

function requireAdmin() {
  requireAuth();

  const user = ctx().get<AuthenticatedUser>('user');

  if (user?.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
}

// Usage
await context_provider.run(async () => {
  await authenticateRequest(token);

  requireAdmin();

  // Only admin users reach here
  await performAdminAction();
});
```

## Real-World Examples

### Complete HTTP Server with Context

```typescript
import { createServer } from 'http';
import { context_provider, ctx } from '@devbro/neko-context';
import { v4 as uuidv4 } from 'uuid';

const server = createServer((req, res) => {
  context_provider.run(async () => {
    // Setup context for this request
    const requestId = uuidv4();
    const startTime = Date.now();

    ctx().set('requestId', requestId);
    ctx().set('startTime', startTime);
    ctx().set('request', req);
    ctx().set('response', res);

    // Log request
    logRequest('Incoming request');

    try {
      // Route handling
      const url = new URL(req.url!, `http://${req.headers.host}`);

      if (url.pathname === '/users' && req.method === 'GET') {
        await getUsers(res);
      } else if (url.pathname.startsWith('/users/') && req.method === 'GET') {
        const userId = url.pathname.split('/')[2];
        await getUser(userId, res);
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    } catch (error) {
      logError('Request failed', error);

      res.writeHead(500);
      res.end(
        JSON.stringify({
          error: 'Internal Server Error',
          requestId,
        })
      );
    } finally {
      const duration = Date.now() - startTime;
      logRequest(`Request completed in ${duration}ms`);
    }
  });
});

function logRequest(message: string, data?: any) {
  const requestId = ctx().get<string>('requestId');
  const req = ctx().get<any>('request');

  console.log(`[${requestId}] ${req.method} ${req.url} - ${message}`, data || '');
}

function logError(message: string, error: any) {
  const requestId = ctx().get<string>('requestId');
  console.error(`[${requestId}] ${message}`, error);
}

async function getUsers(res: any) {
  logRequest('Fetching users');

  const users = await fetchUsers();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(users));
}

async function getUser(userId: string, res: any) {
  logRequest('Fetching user', { userId });

  const user = await fetchUser(userId);

  if (!user) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'User not found' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(user));
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Multi-Tenant Application

```typescript
import { context_provider, ctx } from '@devbro/neko-context';

interface Tenant {
  id: string;
  name: string;
  database: string;
  settings: Record<string, any>;
}

async function handleTenantRequest(tenantId: string, handler: () => Promise<any>) {
  return context_provider.run(async () => {
    // Load tenant information
    const tenant = await loadTenant(tenantId);
    ctx().set('tenant', tenant);

    // Switch to tenant-specific database
    const db = await connectToDatabase(tenant.database);
    ctx().set('db', db);

    // Execute handler with tenant context
    return await handler();
  });
}

// Usage
await handleTenantRequest('tenant-123', async () => {
  const tenant = ctx().get<Tenant>('tenant');
  const db = ctx().get('db');

  console.log(`Processing for tenant: ${tenant.name}`);

  // All database queries use tenant-specific database
  const data = await db.query('SELECT * FROM users');

  return data;
});
```

### Background Job Processing

```typescript
import { context_provider, ctx } from '@devbro/neko-context';

interface Job {
  id: string;
  type: string;
  data: any;
}

async function processJob(job: Job) {
  return context_provider.run(async () => {
    // Setup job context
    ctx().set('jobId', job.id);
    ctx().set('jobType', job.type);
    ctx().set('jobData', job.data);
    ctx().set('startTime', Date.now());

    logJob('Job started');

    try {
      let result;

      switch (job.type) {
        case 'send_email':
          result = await sendEmail(job.data);
          break;
        case 'generate_report':
          result = await generateReport(job.data);
          break;
        case 'process_payment':
          result = await processPayment(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      const duration = Date.now() - ctx().get<number>('startTime')!;
      logJob(`Job completed in ${duration}ms`);

      return result;
    } catch (error) {
      logJobError('Job failed', error);
      throw error;
    }
  });
}

function logJob(message: string, data?: any) {
  const jobId = ctx().get<string>('jobId');
  const jobType = ctx().get<string>('jobType');

  console.log(`[Job ${jobId}] [${jobType}] ${message}`, data || '');
}

function logJobError(message: string, error: any) {
  const jobId = ctx().get<string>('jobId');
  const jobType = ctx().get<string>('jobType');

  console.error(`[Job ${jobId}] [${jobType}] ${message}`, error);
}

// Process multiple jobs concurrently with isolated contexts
const jobs = [
  { id: '1', type: 'send_email', data: { to: 'user1@example.com' } },
  { id: '2', type: 'generate_report', data: { reportId: 123 } },
  { id: '3', type: 'send_email', data: { to: 'user2@example.com' } },
];

await Promise.all(jobs.map(processJob));
```

## Best Practices

### 1. Always Use Context Provider

```typescript
// ❌ Bad: Accessing context without provider
function badFunction() {
  const value = ctx().get('key'); // Throws error
}

// ✅ Good: Always wrap in context provider
await context_provider.run(async () => {
  ctx().set('key', 'value');
  goodFunction();
});

function goodFunction() {
  const value = ctx().get('key'); // Works correctly
}
```

### 2. Use ctxsafe() for Optional Access

```typescript
// ✅ Good: Use ctxsafe() when context may not exist
function utilityFunction() {
  const requestId = ctxsafe()?.get('requestId');

  if (requestId) {
    console.log(`[${requestId}] Processing...`);
  } else {
    console.log('Processing...');
  }
}

// Can be called with or without context
await context_provider.run(async () => {
  ctx().set('requestId', '123');
  utilityFunction(); // Logs: "[123] Processing..."
});

utilityFunction(); // Logs: "Processing..."
```

### 3. Type Your Context Values

```typescript
// ✅ Good: Use TypeScript generics
interface User {
  id: number;
  name: string;
}

ctx().set<User>('user', { id: 1, name: 'John' });
const user = ctx().get<User>('user');

// user is typed as User | undefined
if (user) {
  console.log(user.name); // TypeScript knows user.name exists
}
```

### 4. Clean Up Context When Done

```typescript
// ✅ Good: Clear sensitive data
await context_provider.run(async () => {
  ctx().set('password', 'secret');
  ctx().set('token', 'jwt-token');

  await processAuthentication();

  // Clear sensitive data
  ctx().delete('password');
  ctx().delete('token');
});
```

### 5. Use Consistent Key Names

```typescript
// ✅ Good: Define constants for context keys
const CONTEXT_KEYS = {
  REQUEST_ID: 'requestId',
  USER: 'user',
  TENANT: 'tenant',
  LOGGER: 'logger',
  DB_TRANSACTION: 'dbTransaction',
} as const;

ctx().set(CONTEXT_KEYS.REQUEST_ID, '123');
const requestId = ctx().get(CONTEXT_KEYS.REQUEST_ID);
```

### 6. Handle Errors Properly

```typescript
// ✅ Good: Proper error handling
await context_provider.run(async () => {
  try {
    ctx().set('operation', 'critical-operation');
    await performOperation();
  } catch (error) {
    const operation = ctx().get('operation');
    console.error(`Failed during ${operation}:`, error);
    throw error;
  }
});
```

### 7. Don't Store Large Objects

```typescript
// ❌ Bad: Storing large objects
ctx().set('largeDataset', hugeArray); // Memory intensive

// ✅ Good: Store references or IDs
ctx().set('datasetId', datasetId);

// Fetch when needed
async function getData() {
  const datasetId = ctx().get('datasetId');
  return await fetchDataset(datasetId);
}
```

## Troubleshooting

### Context Returns Undefined

**Problem**: `ctx().get('key')` returns `undefined` even though you set the value.

**Solution**: Ensure you're using the same module resolution (ESM vs CJS) across all packages.

```typescript
// Check your package.json
{
  "type": "module" // Use ESM consistently
}

// Or use CJS consistently
const { ctx } = require('@devbro/neko-context');
```

### Multiple Context Versions

**Problem**: Values set in one part of the code aren't available in another.

**Solution**: Check for duplicate packages in your lock file.

```bash
# Check for multiple versions
npm ls @devbro/neko-context

# Fix by deduplicating
npm dedupe

# Or use npm-force-resolutions
```

### Context Not Available Error

**Problem**: Error: "Accessing context outside of a provider"

**Solution**: Ensure all context access is within `context_provider.run()`.

```typescript
// ❌ Wrong
const value = ctx().get('key'); // Error!

await context_provider.run(async () => {
  ctx().set('key', 'value');
});

// ✅ Correct
await context_provider.run(async () => {
  ctx().set('key', 'value');
  const value = ctx().get('key'); // Works!
});
```

### Async Operations Lose Context

**Problem**: Context values disappear after `await`.

**Solution**: This shouldn't happen with AsyncLocalStorage, but ensure you're not creating new execution contexts.

```typescript
// ✅ This works
await context_provider.run(async () => {
  ctx().set('value', 'test');

  await someAsyncOperation();

  const value = ctx().get('value'); // Still available
});

// ❌ This creates a new context
await context_provider.run(async () => {
  ctx().set('value', 'test');
});

// Context is gone here
const value = ctx().get('value'); // Error!
```

## FAQ

### Q: How is this different from React Context?

**A**: While conceptually similar (providing context to nested code), neko-context is built for Node.js backend applications using AsyncLocalStorage, allowing isolated contexts across async operations. React Context is for component trees in the browser.

### Q: Can I use this in a web browser?

**A**: No, this is a Node.js library built on AsyncLocalStorage, which is not available in browsers. For browser context management, use React Context or similar libraries.

### Q: What's the difference between `ctx()` and `ctxsafe()`?

**A**:

- `ctx()`: Throws an error if called outside a context provider. Use when context is required.
- `ctxsafe()`: Returns `undefined` if no context is available. Use when context is optional.

```typescript
// ctx() - strict mode
const value = ctx().get('key'); // Throws if no context

// ctxsafe() - safe mode
const value = ctxsafe()?.get('key'); // Returns undefined if no context
```

### Q: Why do I need to use `context_provider.run()`?

**A**: The `context_provider.run()` creates a new isolated context scope. Without it, there's no context to store values in. It's similar to how you need a `<Context.Provider>` in React.

### Q: Can I nest context providers?

**A**: Yes! Nested contexts inherit values from outer contexts, but changes in inner contexts don't affect outer contexts.

```typescript
await context_provider.run(async () => {
  ctx().set('outer', 'value');

  await context_provider.run(async () => {
    console.log(ctx().get('outer')); // "value" (inherited)
    ctx().set('inner', 'value');
  });

  console.log(ctx().get('inner')); // undefined (not inherited back)
});
```

### Q: Is this thread-safe?

**A**: Yes, each async execution context is completely isolated. Concurrent operations won't interfere with each other's contexts.

### Q: What's the performance impact?

**A**: Minimal. AsyncLocalStorage is built into Node.js and optimized for this use case. The overhead is negligible for most applications.

### Q: Can I use this with Express/Fastify/other frameworks?

**A**: Absolutely! Wrap your request handlers in `context_provider.run()` to create isolated contexts for each request.

```typescript
app.use((req, res, next) => {
  context_provider.run(async () => {
    ctx().set('requestId', generateId());
    await next();
  });
});
```

### Q: My code acts differently before and after compilation

**A**: This is typically caused by mixing ESM and CJS modules. Each module system maintains its own separate context. Ensure all your code uses the same module system (preferably ESM).

### Q: I updated packages and now `ctx().get()` returns undefined

**A**: Check for multiple versions of `@devbro/neko-context` in your dependency tree:

```bash
npm ls @devbro/neko-context
```

If you see multiple versions, dedupe your dependencies or update all packages to use the same version.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/devbro1/pashmak.git
cd pashmak/neko-context

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Related Packages

- [@devbro/neko-http](https://www.npmjs.com/package/@devbro/neko-http) - HTTP server with automatic context management
- [@devbro/neko-router](https://www.npmjs.com/package/@devbro/neko-router) - HTTP routing with context support
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging with context integration
- [@devbro/neko-sql](https://www.npmjs.com/package/@devbro/neko-sql) - Database with transaction context
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework

## License

MIT

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/devbro1/pashmak/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devbro1/pashmak/discussions)
- 📖 Documentation: [https://devbro1.github.io/pashmak/](https://devbro1.github.io/pashmak/)
