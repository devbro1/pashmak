# @devbro/neko-http

A context-driven HTTP server built for modern Node.js applications, designed to work seamlessly with `@devbro/neko-router`. Features request context management, automatic request ID generation, flexible error handling, CORS support, and comprehensive middleware integration.

[![npm version](https://badge.fury.io/js/%40devbro%2Fneko-http.svg)](https://www.npmjs.com/package/@devbro/neko-http)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Request Context](#request-context)
- [Request ID](#request-id)
- [Error Handling](#error-handling)
- [CORS Configuration](#cors-configuration)
- [Middleware](#middleware)
- [Request & Response](#request--response)
- [Testing](#testing)
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
npm install @devbro/neko-http @devbro/neko-router @devbro/neko-context
```

## Features

- **Context-Driven**: Automatic request context management with `@devbro/neko-context`
- **Request ID**: Automatic unique ID generation for every request (customizable)
- **Error Handling**: Centralized error handling with custom error handlers
- **CORS Support**: Built-in CORS configuration with flexible options
- **Router Integration**: Seamless integration with `@devbro/neko-router`
- **Middleware Support**: Global and route-specific middleware
- **Body Parsing**: Automatic JSON and form data parsing
- **File Uploads**: Multipart form data support
- **Testing**: Easy testing with supertest integration
- **Type Safety**: Full TypeScript support with generic types
- **Performance**: Built on native Node.js HTTP server for maximum speed
- **Graceful Shutdown**: Proper connection cleanup on shutdown

## Quick Start

### Basic HTTP Server

```typescript
import { HttpServer } from '@devbro/neko-http';
import { Router } from '@devbro/neko-router';

// Create router and server
const router = new Router();
const server = new HttpServer({
  port: 3000,
  host: '0.0.0.0',
});

// Add routes
router.addRoute(['GET'], '/', () => {
  return { message: 'Hello World!' };
});

router.addRoute(['GET'], '/users/:id', (req) => {
  return { userId: req.params.id };
});

// Set router and start server
server.setRouter(router);
await server.start();

console.log('Server running on http://localhost:3000');
```

### With Request Context

```typescript
import { HttpServer } from '@devbro/neko-http';
import { Router } from '@devbro/neko-router';
import { ctx } from '@devbro/neko-context';

const router = new Router();

router.addRoute(['GET'], '/track', () => {
  // Access request ID from context
  const requestId = ctx().get('requestId');
  const startTime = ctx().get('startTime');

  return {
    requestId,
    timestamp: startTime,
    message: 'Request tracked',
  };
});

const server = new HttpServer({ port: 3000 });
server.setRouter(router);
await server.start();
```

## Core Concepts

### Server Configuration

```typescript
interface HttpServerConfig {
  port?: number; // Default: 3000
  host?: string; // Default: '0.0.0.0'
  cors?: CorsConfig; // CORS configuration
  bodyLimit?: number; // Max body size in bytes (default: 1MB)
  timeout?: number; // Request timeout in ms (default: 30000)
  keepAliveTimeout?: number; // Keep-alive timeout (default: 5000)
  maxHeadersCount?: number; // Max number of headers (default: 100)
}

const server = new HttpServer({
  port: 8080,
  host: 'localhost',
  timeout: 60000,
  bodyLimit: 10 * 1024 * 1024, // 10MB
});
```

### Request Object

```typescript
interface Request extends IncomingMessage {
  params: Record<string, string>; // URL parameters
  query: Record<string, string>; // Query string parameters
  body: any; // Parsed body (JSON/form)
  files?: Record<string, File[]>; // Uploaded files
  headers: IncomingHttpHeaders; // Request headers
  method: string; // HTTP method
  url: string; // Request URL
  path: string; // URL path
}
```

### Response Helpers

```typescript
interface Response extends ServerResponse {
  json(data: any): void; // Send JSON response
  send(data: string | Buffer): void; // Send text/buffer
  status(code: number): Response; // Set status code
  header(name: string, value: string): Response;
  redirect(url: string, code?: number): void;
}
```

## Request Context

The HTTP server automatically creates a context for each request, accessible via `ctx()` from `@devbro/neko-context`.

### Accessing Context

```typescript
import { ctx } from '@devbro/neko-context';

router.addRoute(['GET'], '/user', async () => {
  // Context is automatically available
  const requestId = ctx().get('requestId');
  const user = ctx().get('user'); // Set by middleware

  return { requestId, user };
});
```

### Setting Context Values

```typescript
// In middleware
router.addMiddleware(async (req, res, next) => {
  const user = await authenticateUser(req);
  ctx().set('user', user);
  ctx().set('authTime', Date.now());
  next();
});

// In route handler
router.addRoute(['POST'], '/data', async (req) => {
  const user = ctx().get('user');
  const data = await saveData(req.body, user);

  ctx().set('savedData', data);
  return { success: true, id: data.id };
});
```

### Context Isolation

Each request has its own isolated context that's automatically cleaned up:

```typescript
router.addRoute(['GET'], '/concurrent', async () => {
  // Each concurrent request has its own context
  const requestId = ctx().get('requestId');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Still the same request context after async operations
  const sameRequestId = ctx().get('requestId');

  return { requestId, sameRequestId };
});
```

## Request ID

Every request automatically gets a unique identifier stored in the context.

### Default Request ID

```typescript
router.addRoute(['GET'], '/log', () => {
  const requestId = ctx().get('requestId') as string;
  console.log(`[${requestId}] Processing request`);

  return { requestId };
});

// Output: [1706659200000-0] Processing request
// Format: {timestamp}-{counter}
```

### Custom Request ID Generator

```typescript
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

// UUID-based request IDs
server.setRequestIdGenerator(() => {
  return uuidv4(); // e.g., '550e8400-e29b-41d4-a716-446655440000'
});

// Custom format
server.setRequestIdGenerator((req) => {
  const timestamp = Date.now();
  const random = randomBytes(4).toString('hex');
  const method = req.method;

  return `${method}-${timestamp}-${random}`;
  // e.g., 'GET-1706659200000-a1b2c3d4'
});

// Include client info
server.setRequestIdGenerator((req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const timestamp = Date.now();

  return `${ip}-${timestamp}`;
});
```

### Using Request ID for Logging

```typescript
import { logger } from '@devbro/neko-logger';

// Middleware to add request ID to all logs
router.addMiddleware((req, res, next) => {
  const requestId = ctx().get('requestId') as string;

  // Store logger with request ID prefix
  const requestLogger = logger.child({ requestId });
  ctx().set('logger', requestLogger);

  next();
});

// Use in routes
router.addRoute(['POST'], '/users', async (req) => {
  const log = ctx().get('logger') as Logger;

  log.info('Creating user', { email: req.body.email });

  try {
    const user = await createUser(req.body);
    log.info('User created successfully', { userId: user.id });
    return user;
  } catch (error) {
    log.error('Failed to create user', { error });
    throw error;
  }
});
```

## Error Handling

### Custom Error Handler

```typescript
server.setErrorHandler(async (err, req, res) => {
  const requestId = ctx().get('requestId');

  console.error(`[${requestId}] Error:`, err);

  // Different handling based on error type
  if (err.name === 'ValidationError') {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Validation Failed',
        details: err.errors,
        requestId,
      })
    );
  } else if (err.name === 'UnauthorizedError') {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Unauthorized',
        requestId,
      })
    );
  } else {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        requestId,
      })
    );
  }
});
```

### Error Handler with Logging

```typescript
import { logger } from '@devbro/neko-logger';

server.setErrorHandler(async (err, req, res) => {
  const requestId = ctx().get('requestId') as string;

  // Log error with context
  logger.error('Request failed', {
    requestId,
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
  });

  // Send user-friendly error response
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: err.message || 'Internal Server Error',
      requestId,
      ...(isDevelopment && { stack: err.stack }),
    })
  );
});
```

### Custom Error Classes

```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ValidationError extends ApiError {
  constructor(
    message: string,
    public errors: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Usage in routes
router.addRoute(['POST'], '/users', async (req) => {
  if (!req.body.email) {
    throw new ValidationError('Invalid input', {
      email: ['Email is required'],
    });
  }

  if (!isAuthorized(req)) {
    throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED');
  }

  return await createUser(req.body);
});
```

## CORS Configuration

### Basic CORS

```typescript
const server = new HttpServer({
  port: 3000,
  cors: {
    enabled: true,
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
  },
});
```

### Advanced CORS

```typescript
const server = new HttpServer({
  port: 3000,
  cors: {
    enabled: true,
    origin: (origin) => {
      // Dynamic origin validation
      const allowedOrigins = ['https://myapp.com', 'https://app.myapp.com', /\.myapp\.com$/];

      return allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
});
```

### Preflight Handling

The server automatically handles OPTIONS requests for CORS preflight:

```typescript
// Client makes preflight request
// OPTIONS /api/users
// Origin: https://app.example.com
// Access-Control-Request-Method: POST
// Access-Control-Request-Headers: Content-Type, Authorization

// Server responds with CORS headers
// Access-Control-Allow-Origin: https://app.example.com
// Access-Control-Allow-Methods: GET, POST, PUT, DELETE
// Access-Control-Allow-Headers: Content-Type, Authorization
// Access-Control-Max-Age: 86400
```

## Middleware

### Global Middleware

```typescript
// Logging middleware
server.addMiddleware(async (req, res, next) => {
  const startTime = Date.now();
  ctx().set('startTime', startTime);

  console.log(`[${ctx().get('requestId')}] ${req.method} ${req.url}`);

  await next();

  const duration = Date.now() - startTime;
  console.log(`[${ctx().get('requestId')}] Completed in ${duration}ms`);
});

// Authentication middleware
server.addMiddleware(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const user = await verifyToken(token);
      ctx().set('user', user);
    } catch (error) {
      // Invalid token, but continue (let routes handle auth)
    }
  }

  await next();
});

// Set router after middleware
server.setRouter(router);
```

### Router Middleware

```typescript
import { Router } from '@devbro/neko-router';

const router = new Router();

// Authentication middleware
const requireAuth = async (req, res, next) => {
  const user = ctx().get('user');

  if (!user) {
    throw new ApiError('Unauthorized', 401);
  }

  next();
};

// Apply to specific routes
router.addRoute(['GET'], '/profile', requireAuth, async () => {
  const user = ctx().get('user');
  return { user };
});

// Admin middleware
const requireAdmin = async (req, res, next) => {
  const user = ctx().get('user');

  if (!user || user.role !== 'admin') {
    throw new ApiError('Forbidden', 403);
  }

  next();
};

router.addRoute(['DELETE'], '/users/:id', [requireAuth, requireAdmin], async (req) => {
  await deleteUser(req.params.id);
  return { success: true };
});
```

## Request & Response

### Request Body Parsing

```typescript
// JSON body
router.addRoute(['POST'], '/api/users', async (req) => {
  const { name, email } = req.body;
  return await createUser({ name, email });
});

// Form data
router.addRoute(['POST'], '/submit', async (req) => {
  // application/x-www-form-urlencoded
  const { username, password } = req.body;
  return await login(username, password);
});

// Multipart form data with files
router.addRoute(['POST'], '/upload', async (req) => {
  const file = req.files?.avatar?.[0];

  if (!file) {
    throw new ValidationError('File required', {
      avatar: ['Avatar file is required'],
    });
  }

  const url = await uploadToS3(file);
  return { url };
});
```

### Query Parameters

```typescript
router.addRoute(['GET'], '/search', (req) => {
  const { q, page = '1', limit = '10' } = req.query;

  return {
    query: q,
    page: parseInt(page),
    limit: parseInt(limit),
  };
});

// GET /search?q=nodejs&page=2&limit=20
```

### URL Parameters

```typescript
router.addRoute(['GET'], '/users/:id/posts/:postId', (req) => {
  const { id, postId } = req.params;

  return {
    userId: id,
    postId: postId,
  };
});

// GET /users/123/posts/456
```

### Response Helpers

```typescript
router.addRoute(['GET'], '/data', (req, res) => {
  // JSON response
  res.json({ message: 'Hello' });

  // With status
  res.status(201).json({ created: true });

  // Custom headers
  res.header('X-Custom-Header', 'value').json({ data: 'with header' });

  // Redirect
  res.redirect('/new-location');
  res.redirect('/moved', 301); // Permanent redirect

  // Plain text
  res.send('Plain text response');

  // Buffer
  const buffer = Buffer.from('Binary data');
  res.send(buffer);
});
```

## Testing

### Using Supertest

```typescript
import supertest from 'supertest';
import { HttpServer } from '@devbro/neko-http';
import { Router } from '@devbro/neko-router';

describe('HTTP Server', () => {
  let server: HttpServer;
  let request: supertest.SuperTest<supertest.Test>;

  beforeEach(() => {
    const router = new Router();

    router.addRoute(['GET'], '/', () => {
      return { message: 'Hello' };
    });

    router.addRoute(['POST'], '/users', (req) => {
      return { id: 1, ...req.body };
    });

    server = new HttpServer();
    server.setRouter(router);

    // Get HTTP handler for testing (without starting server)
    request = supertest(server.getHttpHandler());
  });

  it('should return hello message', async () => {
    const response = await request.get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Hello' });
  });

  it('should create user', async () => {
    const response = await request.post('/users').send({ name: 'John', email: 'john@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('should handle errors', async () => {
    const response = await request.get('/nonexistent');

    expect(response.status).toBe(404);
  });
});
```

### Testing with Context

```typescript
import { ctx } from '@devbro/neko-context';

it('should access request context', async () => {
  const router = new Router();

  router.addRoute(['GET'], '/context', () => {
    const requestId = ctx().get('requestId');
    return { requestId };
  });

  const server = new HttpServer();
  server.setRouter(router);
  const request = supertest(server.getHttpHandler());

  const response = await request.get('/context');

  expect(response.body.requestId).toBeDefined();
  expect(typeof response.body.requestId).toBe('string');
});
```

### Testing Authentication

```typescript
it('should require authentication', async () => {
  const router = new Router();

  const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      throw new ApiError('Unauthorized', 401);
    }
    ctx().set('user', { id: 1, name: 'John' });
    next();
  };

  router.addRoute(['GET'], '/protected', authMiddleware, () => {
    const user = ctx().get('user');
    return { user };
  });

  const server = new HttpServer();
  server.setRouter(router);
  const request = supertest(server.getHttpHandler());

  // Without token
  const unauthResponse = await request.get('/protected');
  expect(unauthResponse.status).toBe(401);

  // With token
  const authResponse = await request.get('/protected').set('Authorization', 'Bearer valid-token');

  expect(authResponse.status).toBe(200);
  expect(authResponse.body.user).toMatchObject({
    id: 1,
    name: 'John',
  });
});
```

## Advanced Features

### Graceful Shutdown

```typescript
const server = new HttpServer({ port: 3000 });
server.setRouter(router);
await server.start();

// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  await server.stop();

  console.log('Server closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});
```

### Request Timeout

```typescript
const server = new HttpServer({
  port: 3000,
  timeout: 30000, // 30 seconds
});

// Override for specific long-running routes
router.addRoute(['POST'], '/long-process', async (req, res) => {
  // Increase timeout for this specific request
  res.setTimeout(120000); // 2 minutes

  const result = await longRunningProcess();
  return result;
});
```

### Custom Body Limit

```typescript
const server = new HttpServer({
  port: 3000,
  bodyLimit: 10 * 1024 * 1024, // 10MB for file uploads
});

// Handle large payloads
router.addRoute(['POST'], '/upload-large', async (req) => {
  // Body size is validated before reaching here
  const data = req.body;
  return { received: data.length };
});
```

### Health Check Endpoint

```typescript
router.addRoute(['GET'], '/health', () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
});

router.addRoute(['GET'], '/ready', async () => {
  // Check dependencies
  const dbConnected = await checkDatabase();
  const cacheConnected = await checkCache();

  if (!dbConnected || !cacheConnected) {
    throw new ApiError('Service not ready', 503);
  }

  return { status: 'ready' };
});
```

## Real-World Examples

### RESTful API Server

```typescript
import { HttpServer } from '@devbro/neko-http';
import { Router } from '@devbro/neko-router';
import { ctx } from '@devbro/neko-context';

const router = new Router();
const server = new HttpServer({
  port: 3000,
  cors: {
    enabled: true,
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
});

// Middleware
router.addMiddleware(async (req, res, next) => {
  const startTime = Date.now();
  const requestId = ctx().get('requestId');

  console.log(`[${requestId}] ${req.method} ${req.url}`);

  await next();

  const duration = Date.now() - startTime;
  console.log(`[${requestId}] ${res.statusCode} - ${duration}ms`);
});

// Authentication
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError('No token provided', 401);
  }

  try {
    const user = await verifyJWT(token);
    ctx().set('user', user);
    next();
  } catch (error) {
    throw new ApiError('Invalid token', 401);
  }
};

// Routes
router.addRoute(['GET'], '/api/users', authMiddleware, async (req) => {
  const { page = 1, limit = 10 } = req.query;
  const users = await getUsers({ page, limit });

  return {
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: await countUsers(),
    },
  };
});

router.addRoute(['POST'], '/api/users', authMiddleware, async (req) => {
  const user = await createUser(req.body);
  return { data: user };
});

router.addRoute(['GET'], '/api/users/:id', authMiddleware, async (req) => {
  const user = await getUserById(req.params.id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  return { data: user };
});

router.addRoute(['PUT'], '/api/users/:id', authMiddleware, async (req) => {
  const currentUser = ctx().get('user');

  if (currentUser.id !== req.params.id && currentUser.role !== 'admin') {
    throw new ApiError('Forbidden', 403);
  }

  const user = await updateUser(req.params.id, req.body);
  return { data: user };
});

router.addRoute(['DELETE'], '/api/users/:id', authMiddleware, async (req) => {
  const currentUser = ctx().get('user');

  if (currentUser.role !== 'admin') {
    throw new ApiError('Forbidden', 403);
  }

  await deleteUser(req.params.id);
  return { success: true };
});

// Error handling
server.setErrorHandler(async (err, req, res) => {
  const requestId = ctx().get('requestId');

  console.error(`[${requestId}] Error:`, err);

  const statusCode = err.statusCode || 500;

  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: err.message || 'Internal Server Error',
      requestId,
      timestamp: new Date().toISOString(),
    })
  );
});

server.setRouter(router);
await server.start();

console.log('API server running on http://localhost:3000');
```

### File Upload Server

```typescript
import { writeFile } from 'fs/promises';
import { join } from 'path';

router.addRoute(['POST'], '/upload', async (req) => {
  const files = req.files?.files;

  if (!files || files.length === 0) {
    throw new ValidationError('No files uploaded', {
      files: ['At least one file is required'],
    });
  }

  const uploadedFiles = [];

  for (const file of files) {
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = join(__dirname, 'uploads', filename);

    await writeFile(filepath, file.buffer);

    uploadedFiles.push({
      filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${filename}`,
    });
  }

  return { files: uploadedFiles };
});
```

### WebSocket Integration

```typescript
import { WebSocketServer } from 'ws';

const server = new HttpServer({ port: 3000 });
server.setRouter(router);

const httpServer = await server.start();

// Add WebSocket server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] WebSocket connection established`);

  ws.on('message', (message) => {
    console.log(`[${requestId}] Received:`, message);
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log(`[${requestId}] WebSocket connection closed`);
  });
});

console.log('HTTP + WebSocket server running on http://localhost:3000');
```

## Best Practices

### 1. Centralized Configuration

```typescript
// config/server.ts
import { HttpServer } from '@devbro/neko-http';

export function createServer() {
  return new HttpServer({
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    timeout: parseInt(process.env.TIMEOUT || '30000'),
    bodyLimit: parseInt(process.env.BODY_LIMIT || '1048576'),
    cors: {
      enabled: true,
      origin: process.env.CORS_ORIGIN || '*',
      credentials: process.env.CORS_CREDENTIALS === 'true',
    },
  });
}
```

### 2. Structured Error Handling

```typescript
// errors/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// errors/handler.ts
export function setupErrorHandler(server: HttpServer) {
  server.setErrorHandler(async (err, req, res) => {
    const requestId = ctx().get('requestId');

    // Log error
    logger.error('Request error', {
      requestId,
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });

    // Send response
    const statusCode = err.statusCode || 500;
    const isDev = process.env.NODE_ENV === 'development';

    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: err.message || 'Internal Server Error',
        code: err.code,
        requestId,
        ...(isDev && { stack: err.stack, details: err.details }),
      })
    );
  });
}
```

### 3. Middleware Organization

```typescript
// middleware/index.ts
export function setupMiddleware(server: HttpServer) {
  // Logging
  server.addMiddleware(loggingMiddleware);

  // Security headers
  server.addMiddleware(securityHeadersMiddleware);

  // Request timing
  server.addMiddleware(timingMiddleware);

  // Authentication (if token present)
  server.addMiddleware(optionalAuthMiddleware);
}

// middleware/logging.ts
export const loggingMiddleware = async (req, res, next) => {
  const requestId = ctx().get('requestId');
  const startTime = Date.now();

  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
  });

  await next();

  logger.info('Request completed', {
    requestId,
    statusCode: res.statusCode,
    duration: Date.now() - startTime,
  });
};
```

### 4. Route Organization

```typescript
// routes/index.ts
import { Router } from '@devbro/neko-router';
import { userRoutes } from './users';
import { postRoutes } from './posts';
import { authRoutes } from './auth';

export function setupRoutes(router: Router) {
  userRoutes(router);
  postRoutes(router);
  authRoutes(router);
}

// routes/users.ts
export function userRoutes(router: Router) {
  router.addRoute(['GET'], '/api/users', requireAuth, getUsers);
  router.addRoute(['POST'], '/api/users', requireAuth, createUser);
  router.addRoute(['GET'], '/api/users/:id', requireAuth, getUserById);
  router.addRoute(['PUT'], '/api/users/:id', requireAuth, updateUser);
  router.addRoute(['DELETE'], '/api/users/:id', requireAuth, deleteUser);
}
```

### 5. Graceful Startup/Shutdown

```typescript
// server.ts
import { createServer } from './config/server';
import { setupRoutes } from './routes';
import { setupMiddleware } from './middleware';
import { setupErrorHandler } from './errors/handler';

async function start() {
  const router = new Router();
  const server = createServer();

  // Setup
  setupMiddleware(server);
  setupRoutes(router);
  setupErrorHandler(server);

  server.setRouter(router);

  // Start server
  await server.start();

  console.log(`Server running on port ${process.env.PORT || 3000}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');

    await server.stop();
    await closeDatabase();
    await closeCache();

    console.log('Server stopped');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

## TypeScript Support

### Type-Safe Request Handlers

```typescript
import { Request, Response } from '@devbro/neko-http';

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

router.addRoute(['POST'], '/users', async (req: Request) => {
  const data = req.body as CreateUserRequest;

  // Type-safe validation
  if (!data.name || !data.email || !data.password) {
    throw new ValidationError('Missing required fields', {
      name: !data.name ? ['Name is required'] : [],
      email: !data.email ? ['Email is required'] : [],
      password: !data.password ? ['Password is required'] : [],
    });
  }

  const user: User = await createUser(data);
  return user;
});
```

### Generic Context Values

```typescript
import { ctx } from '@devbro/neko-context';

interface AuthUser {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

router.addRoute(['GET'], '/profile', () => {
  const user = ctx().get<AuthUser>('user');

  if (!user) {
    throw new ApiError('Unauthorized', 401);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
});
```

## API Reference

### HttpServer

#### Constructor

```typescript
new HttpServer(config?: HttpServerConfig)
```

#### Methods

- `setRouter(router: Router): void` - Set the router instance
- `setErrorHandler(handler: ErrorHandler): void` - Set custom error handler
- `setRequestIdGenerator(generator: RequestIdGenerator): void` - Set custom request ID generator
- `addMiddleware(middleware: Middleware): void` - Add global middleware
- `start(): Promise<Server>` - Start the HTTP server
- `stop(): Promise<void>` - Stop the HTTP server gracefully
- `getHttpHandler(): RequestListener` - Get the HTTP request handler (for testing)

#### Types

```typescript
type ErrorHandler = (err: Error, req: Request, res: Response) => Promise<void>;
type RequestIdGenerator = (req: Request, res: Response) => string | number;
type Middleware = (req: Request, res: Response, next: () => void) => void | Promise<void>;
```

## Troubleshooting

### Port Already in Use

```typescript
const server = new HttpServer({ port: 3000 });

try {
  await server.start();
} catch (error) {
  if (error.code === 'EADDRINUSE') {
    console.error('Port 3000 is already in use');
    // Try alternative port
    const altServer = new HttpServer({ port: 3001 });
    await altServer.start();
  }
}
```

### Request Body Not Parsed

```typescript
// Ensure Content-Type header is set correctly
// application/json for JSON
// application/x-www-form-urlencoded for forms
// multipart/form-data for file uploads

// Client must send:
fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'John' }),
});
```

### Context Not Available

```typescript
// Ensure you're accessing context within request handler
// Context is not available outside request scope

// ✅ Correct
router.addRoute(['GET'], '/data', () => {
  const requestId = ctx().get('requestId'); // Available
  return { requestId };
});

// ❌ Wrong
const requestId = ctx().get('requestId'); // Not available here
router.addRoute(['GET'], '/data', () => {
  return { requestId };
});
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repository
git clone https://github.com/devbro1/pashmak.git
cd pashmak/neko-http

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## Related Packages

- [@devbro/neko-router](https://www.npmjs.com/package/@devbro/neko-router) - HTTP routing and middleware
- [@devbro/neko-context](https://www.npmjs.com/package/@devbro/neko-context) - Request context management
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging with request tracking
- [@devbro/neko-config](https://www.npmjs.com/package/@devbro/neko-config) - Configuration management
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework

## License

MIT

## Support

- 🐛 Issues: [GitHub Issues](https://github.com/devbro1/pashmak/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/devbro1/pashmak/discussions)
- 📖 Documentation: [https://devbro1.github.io/pashmak/](https://devbro1.github.io/pashmak/)
