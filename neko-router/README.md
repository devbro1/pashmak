# @devbro/neko-router

A powerful, flexible routing solution for Node.js and TypeScript applications. Build RESTful APIs and web applications with an intuitive, Express-like API.

## Installation

```bash
npm install @devbro/neko-router
```

## Features

- 🎯 **Flexible Routing** - Support for functions and controllers
- 🛣️ **Path Parameters** - Dynamic route segments with type safety
- 🔒 **Middleware Support** - Function and class-based middleware
- 🔄 **Singleton & Per-Request** - Choose middleware lifecycle
- 📝 **Multiple HTTP Methods** - GET, POST, PUT, DELETE, PATCH, etc.
- 🎨 **Fluent API** - Chainable, intuitive interface
- 🛡️ **Type-Safe** - Full TypeScript support
- ⚡ **High Performance** - Fast route matching and resolution

## Quick Start

```ts
import { Router, Request, Response } from '@devbro/neko-router';

// Create router instance
const router = new Router();

// Add a simple route
router.addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { users: ['Alice', 'Bob', 'Charlie'] };
});

// Resolve and execute
const req = { url: '/api/users', method: 'GET' } as Request;
const res = {} as Response;

const compiledRoute = router.getCompiledRoute(req, res);
const result = await compiledRoute.run();

console.log(result); // { users: ['Alice', 'Bob', 'Charlie'] }
```

## Core Concepts

### Basic Routing

Define routes for different HTTP methods:

```ts
import { Router, Request, Response } from '@devbro/neko-router';

const router = new Router();

// GET request
router.addRoute(['GET'], '/api/posts', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { posts: [] };
});

// POST request
router.addRoute(['POST'], '/api/posts', async (req: Request, res: Response) => {
  res.statusCode = 201;
  return { message: 'Post created' };
});

// PUT request
router.addRoute(['PUT'], '/api/posts/:id', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { message: `Post ${req.params.id} updated` };
});

// DELETE request
router.addRoute(['DELETE'], '/api/posts/:id', async (req: Request, res: Response) => {
  res.statusCode = 204;
  return null;
});
```

### Multiple HTTP Methods

Handle multiple methods on the same route:

```ts
// Support both GET and HEAD
router.addRoute(['GET', 'HEAD'], '/api/health', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { status: 'healthy' };
});

// Common pattern for resources
router.addRoute(['GET', 'POST'], '/api/comments', async (req: Request, res: Response) => {
  if (req.method === 'GET') {
    return { comments: [] };
  } else {
    return { message: 'Comment created' };
  }
});
```

### Path Parameters

Capture dynamic segments from the URL:

```ts
// Single parameter
router.addRoute(['GET'], '/api/users/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  res.statusCode = 200;
  return { userId, name: 'John Doe' };
});

// Multiple parameters
router.addRoute(
  ['GET'],
  '/api/posts/:postId/comments/:commentId',
  async (req: Request, res: Response) => {
    const { postId, commentId } = req.params;
    res.statusCode = 200;
    return { postId, commentId };
  }
);

// Optional parameters with query strings
router.addRoute(['GET'], '/api/search/:category', async (req: Request, res: Response) => {
  const category = req.params.category;
  const query = req.query?.q || '';
  res.statusCode = 200;
  return { category, query };
});
```

## Middleware

### Function Middleware

Use simple functions as middleware:

```ts
// Logging middleware
const loggerMiddleware = async (req: Request, res: Response, next: Function) => {
  console.log(`[${req.method}] ${req.url}`);
  await next();
  console.log(`Response: ${res.statusCode}`);
};

// Authentication middleware
const authMiddleware = async (req: Request, res: Response, next: Function) => {
  const token = req.headers?.authorization;

  if (!token) {
    res.statusCode = 401;
    return { error: 'Unauthorized' };
  }

  // Verify token...
  req.user = { id: 1, name: 'User' };
  await next();
};

// Apply middleware to route
router
  .addRoute(['GET'], '/api/protected', async (req: Request, res: Response) => {
    return { user: req.user };
  })
  .addMiddleware([loggerMiddleware, authMiddleware]);
```

### Multiple Middleware

Chain multiple middleware functions:

```ts
const middleware1 = async (req: Request, res: Response, next: Function) => {
  console.log('Middleware 1 - Before');
  await next();
  console.log('Middleware 1 - After');
};

const middleware2 = async (req: Request, res: Response, next: Function) => {
  console.log('Middleware 2 - Before');
  await next();
  console.log('Middleware 2 - After');
};

router
  .addRoute(['POST'], '/api/data', async (req: Request, res: Response) => {
    return { message: 'Data processed' };
  })
  .addMiddleware([middleware1, middleware2]);

// Execution order:
// Middleware 1 - Before
// Middleware 2 - Before
// Route handler
// Middleware 2 - After
// Middleware 1 - After
```

### Inline Middleware

Add middleware directly in the chain:

```ts
router
  .addRoute(['GET'], '/api/users/:id', async (req: Request, res: Response) => {
    return { userId: req.params.id };
  })
  .addMiddleware(async (req, res, next) => {
    console.log('Accessing user:', req.params.id);
    await next();
    console.log('Request completed with status:', res.statusCode);
  });
```

### Class-Based Middleware

Use classes for more complex middleware:

```ts
class AuthenticationMiddleware {
  async handle(req: Request, res: Response, next: Function) {
    // Authentication logic
    const token = req.headers?.authorization;

    if (!token) {
      res.statusCode = 401;
      throw new Error('No token provided');
    }

    // Verify and attach user
    req.user = await this.verifyToken(token);
    await next();
  }

  private async verifyToken(token: string) {
    // Token verification logic
    return { id: 1, email: 'user@example.com' };
  }
}

// Use the class middleware
const authMiddleware = new AuthenticationMiddleware();

router
  .addRoute(['GET'], '/api/profile', async (req: Request, res: Response) => {
    return { profile: req.user };
  })
  .addMiddleware(authMiddleware.handle.bind(authMiddleware));
```

### Singleton vs Per-Request Middleware

```ts
// Singleton middleware - shared instance across requests
class CacheMiddleware {
  private cache = new Map();

  async handle(req: Request, res: Response, next: Function) {
    const key = req.url;

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    await next();
    this.cache.set(key, res.body);
  }
}

const cacheMiddleware = new CacheMiddleware(); // Single instance

// Per-request middleware - new instance for each request
router
  .addRoute(['GET'], '/api/data', async (req: Request, res: Response) => {
    return { data: 'expensive computation' };
  })
  .addMiddleware(cacheMiddleware.handle.bind(cacheMiddleware));
```

## Route Resolution

### Resolving Routes

```ts
const router = new Router();

router.addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
  return { users: [] };
});

// Create request object
const req = {
  url: '/api/users',
  method: 'GET',
  headers: {},
  query: {},
} as Request;

const res = {} as Response;

// Resolve the route
const resolved = router.resolve(req);
console.log(resolved); // Route information

// Get compiled route and execute
const compiledRoute = router.getCompiledRoute(req, res);
const result = await compiledRoute.run();

console.log(res.statusCode); // 200
console.log(result); // { users: [] }
```

### Handling 404

```ts
const req = { url: '/api/nonexistent', method: 'GET' } as Request;
const res = {} as Response;

try {
  const compiledRoute = router.getCompiledRoute(req, res);
  await compiledRoute.run();
} catch (error) {
  // Handle route not found
  res.statusCode = 404;
  return { error: 'Route not found' };
}
```

## Real-World Examples

### RESTful API

```ts
import { Router, Request, Response } from '@devbro/neko-router';

const router = new Router();

// Logging middleware
const logger = async (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`[${req.method}] ${req.url} - ${res.statusCode} (${duration}ms)`);
};

// List all posts
router
  .addRoute(['GET'], '/api/posts', async (req: Request, res: Response) => {
    const posts = await database.getPosts();
    res.statusCode = 200;
    return { posts };
  })
  .addMiddleware(logger);

// Get single post
router
  .addRoute(['GET'], '/api/posts/:id', async (req: Request, res: Response) => {
    const post = await database.getPost(req.params.id);
    res.statusCode = 200;
    return { post };
  })
  .addMiddleware(logger);

// Create post
router
  .addRoute(['POST'], '/api/posts', async (req: Request, res: Response) => {
    const newPost = await database.createPost(req.body);
    res.statusCode = 201;
    return { post: newPost };
  })
  .addMiddleware([logger, authMiddleware]);

// Update post
router
  .addRoute(['PUT'], '/api/posts/:id', async (req: Request, res: Response) => {
    const updated = await database.updatePost(req.params.id, req.body);
    res.statusCode = 200;
    return { post: updated };
  })
  .addMiddleware([logger, authMiddleware]);

// Delete post
router
  .addRoute(['DELETE'], '/api/posts/:id', async (req: Request, res: Response) => {
    await database.deletePost(req.params.id);
    res.statusCode = 204;
    return null;
  })
  .addMiddleware([logger, authMiddleware]);
```

### Error Handling Middleware

```ts
const errorHandler = async (req: Request, res: Response, next: Function) => {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    res.statusCode = 500;
    return {
      error: 'Internal Server Error',
      message: error.message,
    };
  }
};

router
  .addRoute(['GET'], '/api/risky', async (req: Request, res: Response) => {
    throw new Error('Something went wrong!');
  })
  .addMiddleware(errorHandler);
```

### Request Validation

```ts
const validateCreateUser = async (req: Request, res: Response, next: Function) => {
  const { email, name } = req.body;

  if (!email || !name) {
    res.statusCode = 400;
    return { error: 'Email and name are required' };
  }

  if (!email.includes('@')) {
    res.statusCode = 400;
    return { error: 'Invalid email format' };
  }

  await next();
};

router
  .addRoute(['POST'], '/api/users', async (req: Request, res: Response) => {
    const user = await createUser(req.body);
    res.statusCode = 201;
    return { user };
  })
  .addMiddleware(validateCreateUser);
```

### CORS Middleware

```ts
const corsMiddleware = async (req: Request, res: Response, next: Function) => {
  res.headers = {
    ...res.headers,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return null;
  }

  await next();
};

// Apply to all routes
router
  .addRoute(
    ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    '/api/*',
    async (req: Request, res: Response) => {
      // Route handler
    }
  )
  .addMiddleware(corsMiddleware);
```

### Rate Limiting

```ts
class RateLimiter {
  private requests = new Map<string, number[]>();
  private limit = 100;
  private window = 60000; // 1 minute

  async handle(req: Request, res: Response, next: Function) {
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const now = Date.now();

    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }

    const userRequests = this.requests.get(ip)!;
    const recentRequests = userRequests.filter((time) => now - time < this.window);

    if (recentRequests.length >= this.limit) {
      res.statusCode = 429;
      return { error: 'Too many requests' };
    }

    recentRequests.push(now);
    this.requests.set(ip, recentRequests);

    await next();
  }
}

const rateLimiter = new RateLimiter();

router
  .addRoute(['GET'], '/api/data', async (req: Request, res: Response) => {
    return { data: 'sensitive information' };
  })
  .addMiddleware(rateLimiter.handle.bind(rateLimiter));
```

## Integration with HTTP Servers

### With Node.js HTTP

```ts
import http from 'http';
import { Router, Request, Response } from '@devbro/neko-router';

const router = new Router();

// Define routes
router.addRoute(['GET'], '/api/hello', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { message: 'Hello World' };
});

// Create HTTP server
const server = http.createServer(async (req, res) => {
  try {
    const request = req as Request;
    const response = res as Response;

    const compiledRoute = router.getCompiledRoute(request, response);
    const result = await compiledRoute.run();

    res.writeHead(response.statusCode || 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### With Express

```ts
import express from 'express';
import { Router as NekoRouter, Request, Response } from '@devbro/neko-router';

const app = express();
const router = new NekoRouter();

// Define routes in neko-router
router.addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
  res.statusCode = 200;
  return { users: [] };
});

// Use as Express middleware
app.use(async (req, res, next) => {
  try {
    const request = req as Request;
    const response = res as Response;

    const compiledRoute = router.getCompiledRoute(request, response);
    const result = await compiledRoute.run();

    res.status(response.statusCode || 200).json(result);
  } catch (error) {
    next();
  }
});

app.listen(3000);
```

## Best Practices

1. **Organize Routes** - Group related routes together
2. **Use Middleware** - Extract common logic into reusable middleware
3. **Error Handling** - Always wrap route handlers in error handling middleware
4. **Validation** - Validate input data before processing
5. **Type Safety** - Use TypeScript interfaces for request/response types
6. **Status Codes** - Set appropriate HTTP status codes
7. **Async/Await** - Use async/await for cleaner asynchronous code
8. **Naming** - Use descriptive names for routes and middleware

## TypeScript Support

Full TypeScript definitions included:

```ts
import { Router, Request, Response, Middleware } from '@devbro/neko-router';

// Extend Request type
interface CustomRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Type-safe route handler
router.addRoute(['GET'], '/api/profile', async (req: CustomRequest, res: Response) => {
  if (!req.user) {
    res.statusCode = 401;
    return { error: 'Unauthorized' };
  }

  return { profile: req.user };
});

// Type-safe middleware
const authMiddleware: Middleware = async (req: CustomRequest, res: Response, next: Function) => {
  // Authentication logic
  await next();
};
```

## API Reference

### `Router`

#### Methods

##### `addRoute(methods: string[], path: string, handler: Function): Route`

Add a new route to the router.

```ts
router.addRoute(['GET', 'POST'], '/api/users', handler);
```

##### `resolve(req: Request): RouteInfo | null`

Resolve a request to route information.

```ts
const routeInfo = router.resolve(req);
```

##### `getCompiledRoute(req: Request, res: Response): CompiledRoute`

Get a compiled route ready for execution.

```ts
const compiled = router.getCompiledRoute(req, res);
await compiled.run();
```

### `Route`

#### Methods

##### `addMiddleware(middleware: Function | Function[]): Route`

Add middleware to the route.

```ts
route.addMiddleware([middleware1, middleware2]);
route.addMiddleware(singleMiddleware);
```

### Types

```ts
interface Request {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  [key: string]: any;
}

interface Response {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
  [key: string]: any;
}

type Middleware = (req: Request, res: Response, next: Function) => Promise<any>;
```

## Performance Tips

1. **Route Order** - Place specific routes before generic ones
2. **Middleware Order** - Put fast middleware before slow ones
3. **Caching** - Cache route resolution results when possible
4. **Async Operations** - Use async/await efficiently
5. **Memory Management** - Clean up middleware state appropriately

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Packages

- [@devbro/neko-http](https://www.npmjs.com/package/@devbro/neko-http) - HTTP client utilities
- [@devbro/neko-context](https://www.npmjs.com/package/@devbro/neko-context) - Context management
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
