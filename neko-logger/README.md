# @devbro/neko-logger

A powerful and production-ready logging library for Node.js applications, built on top of Pino for high-performance structured logging with support for multiple transports, log levels, child loggers, and context integration.

[![npm version](https://badge.fury.io/js/%40devbro%2Fneko-logger.svg)](https://www.npmjs.com/package/@devbro/neko-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Log Levels](#log-levels)
- [Structured Logging](#structured-logging)
- [Child Loggers](#child-loggers)
- [Context Integration](#context-integration)
- [Configuration](#configuration)
- [Transports](#transports)
- [Formatting](#formatting)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [TypeScript Support](#typescript-support)
- [API Reference](#api-reference)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Related Packages](#related-packages)

## Installation

```bash
npm install @devbro/neko-logger
```

## Features

- **High Performance**: Built on Pino, one of the fastest Node.js loggers
- **Structured Logging**: JSON-formatted logs for easy parsing and analysis
- **Multiple Log Levels**: trace, debug, info, warn, error, fatal
- **Child Loggers**: Create contextual loggers with inherited properties
- **Pretty Printing**: Human-readable output for development
- **Multiple Transports**: File, console, cloud services (via Pino transports)
- **Context Integration**: Works seamlessly with `@devbro/neko-context`
- **Type Safety**: Full TypeScript support
- **Zero Config**: Works out of the box with sensible defaults
- **Production Ready**: Battle-tested in production environments
- **Log Rotation**: Built-in support for log rotation
- **Redaction**: Automatic redaction of sensitive data

## Quick Start

### Basic Usage

```typescript
import { Logger } from '@devbro/neko-logger';

// Create a logger instance
const logger = new Logger();

// Log at different levels
logger.trace('Detailed trace information');
logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning message');
logger.error('Error occurred');
logger.fatal('Fatal error, application will exit');
```

### Structured Logging

```typescript
import { Logger } from '@devbro/neko-logger';

const logger = new Logger();

// Log with additional data
logger.info({
  msg: 'User login successful',
  userId: 123,
  email: 'user@example.com',
  ipAddress: '192.168.1.1',
});

// Log errors
try {
  await someOperation();
} catch (error) {
  logger.error({
    msg: 'Operation failed',
    error,
    requestId: 'req-123',
    details: { operation: 'someOperation' },
  });
}
```

### Simple String Logging

```typescript
const logger = new Logger();

logger.info('my log message');
logger.error('Something went wrong');
logger.warn('This is a warning');
```

## Core Concepts

### Logger Instance

Each logger instance can be configured independently:

```typescript
import { Logger } from '@devbro/neko-logger';

// Default logger
const logger = new Logger();

// Logger with custom configuration
const customLogger = new Logger({
  level: 'debug',
  name: 'my-app',
  prettyPrint: true,
});
```

### Log Levels

Loggers support six standard log levels (from lowest to highest priority):

1. **trace** (10): Very detailed debugging information
2. **debug** (20): Debugging information
3. **info** (30): General informational messages (default)
4. **warn** (40): Warning messages
5. **error** (50): Error messages
6. **fatal** (60): Fatal errors that will likely crash the application

```typescript
const logger = new Logger({ level: 'debug' });

logger.trace('This will not be logged (below debug)');
logger.debug('This will be logged');
logger.info('This will be logged');
logger.warn('This will be logged');
logger.error('This will be logged');
logger.fatal('This will be logged');
```

## Structured Logging

### Object-Based Logging

```typescript
const logger = new Logger();

// Log with structured data
logger.info({
  msg: 'HTTP request received',
  method: 'GET',
  url: '/api/users',
  statusCode: 200,
  duration: 45,
  userAgent: 'Mozilla/5.0...',
});

// Output (JSON):
// {
//   "level": 30,
//   "time": 1706659200000,
//   "msg": "HTTP request received",
//   "method": "GET",
//   "url": "/api/users",
//   "statusCode": 200,
//   "duration": 45,
//   "userAgent": "Mozilla/5.0..."
// }
```

### String with Context

```typescript
logger.info('User registered', {
  userId: 123,
  email: 'user@example.com',
  plan: 'premium',
});
```

### Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error({
    msg: 'Failed to process request',
    error: error,
    stack: error.stack,
    code: error.code,
    context: {
      userId: 123,
      operation: 'riskyOperation',
    },
  });
}
```

## Child Loggers

Create child loggers that inherit properties from the parent:

```typescript
import { Logger } from '@devbro/neko-logger';

const logger = new Logger({ name: 'app' });

// Create child logger with additional context
const requestLogger = logger.child({
  requestId: 'req-abc-123',
  userId: 456,
});

// All logs from requestLogger will include requestId and userId
requestLogger.info('Processing request');
// Output: { "requestId": "req-abc-123", "userId": 456, "msg": "Processing request", ... }

requestLogger.info('Request completed', { duration: 150 });
// Output: { "requestId": "req-abc-123", "userId": 456, "duration": 150, "msg": "Request completed", ... }
```

### Nested Child Loggers

```typescript
const appLogger = new Logger({ name: 'app' });

const moduleLogger = appLogger.child({ module: 'auth' });

const operationLogger = moduleLogger.child({ operation: 'login' });

operationLogger.info('User login attempt');
// Output includes: name: 'app', module: 'auth', operation: 'login'
```

## Context Integration

Integrate with `@devbro/neko-context` for automatic request tracking:

```typescript
import { Logger } from '@devbro/neko-logger';
import { ctx, context_provider } from '@devbro/neko-context';

const logger = new Logger();

// In your HTTP server
await context_provider.run(async () => {
  const requestId = generateRequestId();

  // Create request-specific logger
  const requestLogger = logger.child({ requestId });
  ctx().set('logger', requestLogger);

  await handleRequest();
});

async function handleRequest() {
  // Access logger from context
  const log = ctx().get('logger');

  log.info('Processing request');
  log.debug('Fetching user data');
  log.info('Request completed');

  // All logs automatically include requestId
}
```

## Configuration

### Logger Options

```typescript
interface LoggerOptions {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  name?: string; // Logger name
  prettyPrint?: boolean; // Enable pretty printing (development)
  destination?: string; // File path for logs
  redact?: string[]; // Fields to redact
  serializers?: Record<string, Function>; // Custom serializers
  base?: Record<string, any>; // Base context for all logs
  timestamp?: boolean | Function; // Timestamp format
  messageKey?: string; // Custom message key (default: 'msg')
}
```

### Development Configuration

```typescript
const devLogger = new Logger({
  level: 'debug',
  prettyPrint: true,
  name: 'dev-app',
});

devLogger.debug('Detailed debug info'); // Pretty printed, colorized
```

### Production Configuration

```typescript
const prodLogger = new Logger({
  level: 'info',
  prettyPrint: false,
  name: 'prod-app',
  redact: ['password', 'token', 'apiKey', 'secret'],
});

prodLogger.info({
  msg: 'User authenticated',
  password: 'secret123', // Will be redacted
  username: 'john',
});
// Output: { "msg": "User authenticated", "password": "[Redacted]", "username": "john" }
```

### Custom Base Context

```typescript
const logger = new Logger({
  base: {
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    hostname: os.hostname(),
  },
});

logger.info('Application started');
// Every log includes environment, version, and hostname
```

## Transports

### File Transport

```typescript
import { Logger } from '@devbro/neko-logger';

const logger = new Logger({
  destination: '/var/log/app.log',
});

logger.info('This will be logged to file');
```

### Multiple Transports

```typescript
import pino from 'pino';

const streams = [
  // Console output
  { stream: process.stdout },

  // File output
  { stream: pino.destination('/var/log/app.log') },

  // Error file (only errors)
  {
    level: 'error',
    stream: pino.destination('/var/log/error.log'),
  },
];

const logger = new Logger({
  // Configure with pino-multi-stream
});
```

### Log Rotation

```typescript
import pino from 'pino';

const logger = new Logger({
  destination: pino.destination({
    dest: '/var/log/app.log',
    minLength: 4096,
    sync: false,
  }),
});

// Or use pino-rotating-file-stream for time-based rotation
```

## Formatting

### Pretty Print (Development)

```typescript
const logger = new Logger({
  prettyPrint: true,
});

logger.info('User logged in', { userId: 123 });

// Output (colorized):
// [2026-01-31 10:30:45.123] INFO: User logged in
//     userId: 123
```

### Custom Message Key

```typescript
const logger = new Logger({
  messageKey: 'message',
});

logger.info({ message: 'Custom key' });
// Output uses "message" instead of "msg"
```

### Custom Timestamp

```typescript
const logger = new Logger({
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
});

logger.info('Custom timestamp format');
```

## Real-World Examples

### HTTP Server Logging

```typescript
import { createServer } from 'http';
import { Logger } from '@devbro/neko-logger';
import { context_provider, ctx } from '@devbro/neko-context';

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  name: 'http-server',
});

const server = createServer((req, res) => {
  context_provider.run(async () => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Create request logger
    const requestLogger = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    ctx().set('logger', requestLogger);

    requestLogger.info('Request started');

    try {
      await handleRequest(req, res);

      const duration = Date.now() - startTime;
      requestLogger.info('Request completed', {
        statusCode: res.statusCode,
        duration,
      });
    } catch (error) {
      requestLogger.error({
        msg: 'Request failed',
        error: error.message,
        stack: error.stack,
      });

      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
});

async function handleRequest(req, res) {
  const log = ctx().get('logger');

  log.debug('Parsing request body');
  const body = await parseBody(req);

  log.debug('Validating input');
  validateInput(body);

  log.debug('Processing request');
  const result = await process(body);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

server.listen(3000, () => {
  logger.info('Server started', { port: 3000 });
});
```

### Database Query Logging

```typescript
import { Logger } from '@devbro/neko-logger';
import { Database } from '@devbro/neko-sql';

const dbLogger = new Logger({
  name: 'database',
  level: 'debug',
});

class DatabaseService {
  private db: Database;
  private logger: Logger;

  constructor() {
    this.db = new Database();
    this.logger = dbLogger;
  }

  async query(sql: string, params: any[]) {
    const queryLogger = this.logger.child({
      queryId: generateQueryId(),
      sql: sql.substring(0, 100), // Truncate for logging
    });

    const startTime = Date.now();

    queryLogger.debug('Executing query', { params });

    try {
      const result = await this.db.query(sql, params);

      const duration = Date.now() - startTime;
      queryLogger.info('Query completed', {
        duration,
        rowCount: result.length,
      });

      return result;
    } catch (error) {
      queryLogger.error({
        msg: 'Query failed',
        error: error.message,
        params,
      });
      throw error;
    }
  }
}
```

### Background Job Logging

```typescript
import { Logger } from '@devbro/neko-logger';
import { context_provider, ctx } from '@devbro/neko-context';

const jobLogger = new Logger({
  name: 'job-processor',
  level: 'info',
});

interface Job {
  id: string;
  type: string;
  data: any;
}

async function processJob(job: Job) {
  return context_provider.run(async () => {
    const logger = jobLogger.child({
      jobId: job.id,
      jobType: job.type,
    });

    ctx().set('logger', logger);

    logger.info('Job started', { data: job.data });

    const startTime = Date.now();

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

      const duration = Date.now() - startTime;
      logger.info('Job completed', { duration, result });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error({
        msg: 'Job failed',
        error: error.message,
        stack: error.stack,
        duration,
      });
      throw error;
    }
  });
}

async function sendEmail(data: any) {
  const log = ctx().get('logger');

  log.debug('Preparing email', { to: data.to });
  log.debug('Sending email via provider');

  // Email sending logic

  log.info('Email sent successfully');
}
```

### Multi-Service Application

```typescript
import { Logger } from '@devbro/neko-logger';

// Base application logger
const appLogger = new Logger({
  name: 'myapp',
  level: process.env.LOG_LEVEL || 'info',
  base: {
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
});

// Service-specific loggers
export const authLogger = appLogger.child({ service: 'auth' });
export const paymentLogger = appLogger.child({ service: 'payment' });
export const notificationLogger = appLogger.child({ service: 'notification' });
export const analyticsLogger = appLogger.child({ service: 'analytics' });

// Usage in auth service
authLogger.info('User login attempt', { email: 'user@example.com' });
authLogger.warn('Failed login attempt', { email: 'user@example.com', reason: 'invalid_password' });

// Usage in payment service
paymentLogger.info('Payment initiated', { amount: 99.99, currency: 'USD' });
paymentLogger.error('Payment failed', { error: 'insufficient_funds' });

// All logs include: name: 'myapp', service: 'auth|payment|notification|analytics'
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
const logger = new Logger();

// ✅ Good: Use correct levels
logger.trace('Entering function with params', { params }); // Very detailed
logger.debug('Cache hit', { key: 'user:123' }); // Debug info
logger.info('User registered', { userId: 123 }); // Important events
logger.warn('API rate limit approaching', { usage: 0.8 }); // Warnings
logger.error('Database connection failed', { error }); // Errors
logger.fatal('Cannot start server', { error }); // Critical failures

// ❌ Bad: Wrong level usage
logger.info('Detailed loop iteration', { i: 1000 }); // Should be trace/debug
logger.error('User logged in'); // Should be info
```

### 2. Use Structured Logging

```typescript
// ✅ Good: Structured data
logger.info('User action', {
  userId: 123,
  action: 'purchase',
  itemId: 456,
  amount: 99.99,
  currency: 'USD',
});

// ❌ Bad: Concatenated strings
logger.info(`User 123 purchased item 456 for 99.99 USD`);
```

### 3. Create Child Loggers for Context

```typescript
const logger = new Logger();

// ✅ Good: Child logger with context
async function handleRequest(requestId: string, userId: number) {
  const requestLogger = logger.child({ requestId, userId });

  requestLogger.info('Processing request');
  requestLogger.debug('Fetching data');
  requestLogger.info('Request completed');
}

// ❌ Bad: Repeating context
async function handleRequest(requestId: string, userId: number) {
  logger.info('Processing request', { requestId, userId });
  logger.debug('Fetching data', { requestId, userId });
  logger.info('Request completed', { requestId, userId });
}
```

### 4. Log Errors Properly

```typescript
// ✅ Good: Log full error details
try {
  await operation();
} catch (error) {
  logger.error({
    msg: 'Operation failed',
    error: error.message,
    stack: error.stack,
    code: error.code,
    context: { userId: 123 },
  });
}

// ❌ Bad: Lose error information
try {
  await operation();
} catch (error) {
  logger.error('Operation failed');
}
```

### 5. Redact Sensitive Information

```typescript
// ✅ Good: Configure redaction
const logger = new Logger({
  redact: ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn', 'authorization'],
});

logger.info('User login', {
  email: 'user@example.com',
  password: 'secret123', // Automatically redacted
});

// ❌ Bad: Log sensitive data
logger.info('User login', {
  email: 'user@example.com',
  password: 'secret123', // Exposed in logs!
});
```

### 6. Use Environment-Specific Configuration

```typescript
// config/logger.ts
import { Logger } from '@devbro/neko-logger';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const logger = new Logger({
  level: isDevelopment ? 'debug' : 'info',
  prettyPrint: isDevelopment,
  name: process.env.APP_NAME || 'app',
  redact: isProduction ? ['password', 'token', 'apiKey', 'secret'] : [],
  destination: isProduction ? '/var/log/app.log' : undefined,
});
```

### 7. Don't Log in Tight Loops

```typescript
// ✅ Good: Log summary
const results = [];
for (let i = 0; i < 10000; i++) {
  results.push(process(i));
}
logger.info('Processed items', { count: results.length });

// ❌ Bad: Log every iteration
for (let i = 0; i < 10000; i++) {
  logger.debug('Processing item', { index: i }); // 10,000 log entries!
  process(i);
}
```

## TypeScript Support

### Type-Safe Logging

```typescript
import { Logger } from '@devbro/neko-logger';

interface LogContext {
  requestId: string;
  userId: number;
  sessionId: string;
}

interface ErrorContext extends LogContext {
  error: Error;
  stack?: string;
}

const logger = new Logger();

function logRequest(context: LogContext, message: string) {
  logger.info({ ...context, msg: message });
}

function logError(context: ErrorContext, message: string) {
  logger.error({
    ...context,
    msg: message,
    error: context.error.message,
    stack: context.error.stack,
  });
}

// Usage with type safety
logRequest(
  {
    requestId: 'req-123',
    userId: 456,
    sessionId: 'sess-789',
  },
  'Request processed'
);
```

### Custom Logger Class

```typescript
import { Logger } from '@devbro/neko-logger';

class ApplicationLogger {
  private logger: Logger;

  constructor(name: string) {
    this.logger = new Logger({ name });
  }

  logHttpRequest(method: string, url: string, statusCode: number, duration: number): void {
    this.logger.info({
      msg: 'HTTP request',
      method,
      url,
      statusCode,
      duration,
    });
  }

  logDatabaseQuery(query: string, params: any[], duration: number): void {
    this.logger.debug({
      msg: 'Database query',
      query: query.substring(0, 100),
      paramCount: params.length,
      duration,
    });
  }

  logError(error: Error, context?: Record<string, any>): void {
    this.logger.error({
      msg: error.message,
      error: error.message,
      stack: error.stack,
      ...context,
    });
  }
}

export const appLogger = new ApplicationLogger('myapp');
```

## API Reference

### Logger Class

#### Constructor

```typescript
new Logger(options?: LoggerOptions)
```

#### Methods

##### `trace(obj: object, msg?: string): void`

##### `trace(msg: string): void`

Log at trace level (most detailed).

```typescript
logger.trace('Entering function');
logger.trace({ params: [1, 2, 3] }, 'Function called');
```

##### `debug(obj: object, msg?: string): void`

##### `debug(msg: string): void`

Log at debug level.

```typescript
logger.debug('Cache miss for key', { key: 'user:123' });
```

##### `info(obj: object, msg?: string): void`

##### `info(msg: string): void`

Log at info level (default).

```typescript
logger.info('User logged in', { userId: 123 });
```

##### `warn(obj: object, msg?: string): void`

##### `warn(msg: string): void`

Log at warn level.

```typescript
logger.warn('Deprecated API called', { api: '/old-endpoint' });
```

##### `error(obj: object, msg?: string): void`

##### `error(msg: string): void`

Log at error level.

```typescript
logger.error({ msg: 'Failed to save', error }, 'Database error');
```

##### `fatal(obj: object, msg?: string): void`

##### `fatal(msg: string): void`

Log at fatal level.

```typescript
logger.fatal('Cannot connect to database', { error });
```

##### `child(bindings: object): Logger`

Create a child logger with additional context.

```typescript
const childLogger = logger.child({ requestId: '123' });
```

### LoggerOptions Interface

```typescript
interface LoggerOptions {
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  name?: string;
  prettyPrint?: boolean;
  destination?: string;
  redact?: string[];
  serializers?: Record<string, Function>;
  base?: Record<string, any>;
  timestamp?: boolean | Function;
  messageKey?: string;
}
```

## Performance

### Benchmarks

Pino (which neko-logger uses) is one of the fastest Node.js loggers:

```
pino (neko-logger):   ~60,000 ops/sec
winston:              ~15,000 ops/sec
bunyan:               ~20,000 ops/sec
```

### Performance Tips

1. **Use appropriate log levels in production**

   ```typescript
   const logger = new Logger({
     level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
   });
   ```

2. **Disable pretty print in production**

   ```typescript
   const logger = new Logger({
     prettyPrint: process.env.NODE_ENV === 'development',
   });
   ```

3. **Use asynchronous logging for high-throughput**

   ```typescript
   import pino from 'pino';

   const logger = new Logger({
     destination: pino.destination({
       dest: '/var/log/app.log',
       sync: false, // Asynchronous logging
     }),
   });
   ```

4. **Avoid expensive operations in log statements**

   ```typescript
   // ❌ Bad: Expensive serialization
   logger.debug('User data', { user: JSON.stringify(largeObject) });

   // ✅ Good: Let Pino handle serialization
   logger.debug('User data', { user: largeObject });
   ```

## Troubleshooting

### Logs Not Appearing

**Problem**: Logs are not showing up in the console.

**Solution**: Check the log level configuration.

```typescript
// Ensure log level is set appropriately
const logger = new Logger({
  level: 'debug', // Lower the level to see more logs
});
```

### Pretty Print Not Working

**Problem**: Logs are showing as JSON even with `prettyPrint: true`.

**Solution**: Install `pino-pretty` if not already installed:

```bash
npm install pino-pretty
```

### File Logging Issues

**Problem**: Logs not writing to file.

**Solution**: Ensure directory exists and has write permissions:

```typescript
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const logPath = '/var/log/app.log';
mkdirSync(dirname(logPath), { recursive: true });

const logger = new Logger({
  destination: logPath,
});
```

### Memory Issues with High Log Volume

**Problem**: Application running out of memory with many logs.

**Solution**: Use asynchronous logging and log rotation:

```typescript
import pino from 'pino';

const logger = new Logger({
  destination: pino.destination({
    dest: '/var/log/app.log',
    minLength: 4096,
    sync: false,
  }),
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/devbro1/pashmak.git
cd pashmak/neko-logger

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Related Packages

- [@devbro/neko-context](https://www.npmjs.com/package/@devbro/neko-context) - Context management for request tracking
- [@devbro/neko-http](https://www.npmjs.com/package/@devbro/neko-http) - HTTP server with integrated logging
- [@devbro/neko-router](https://www.npmjs.com/package/@devbro/neko-router) - HTTP routing with logging support
- [@devbro/neko-sql](https://www.npmjs.com/package/@devbro/neko-sql) - Database with query logging
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework

## License

MIT

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/devbro1/pashmak/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devbro1/pashmak/discussions)
- 📖 Documentation: [https://devbro1.github.io/pashmak/](https://devbro1.github.io/pashmak/)
