---
sidebar_position: 2
---

# Facades

Facades in Pashmak provide a clean, convenient interface to access framework services. They act as static-like proxies to underlying service instances, giving you a simple and expressive syntax while maintaining flexibility and testability.

## What are Facades?

A facade is a design pattern that provides a simplified interface to complex subsystems. In Pashmak, facades allow you to access framework features without worrying about instantiation, configuration, or dependency management. The framework handles all the complexity behind the scenes.

## Why Use Facades?

Facades offer several benefits:

- **Simple API**: Clean, memorable syntax for accessing services
- **Singleton Management**: Automatic handling of service instances
- **Lazy Initialization**: Services are only created when needed
- **Multiple Instances**: Support for labeled instances (e.g., multiple databases or caches)
- **Flexible Syntax**: Both function call and direct method access patterns
- **Context Awareness**: Integration with Pashmak's context system

## Available Facades

Pashmak provides the following built-in facades:

- `router` - HTTP routing and controller registration
- `httpServer` - HTTP server configuration
- `logger` - Logging service
- `db` - Database connections
- `cache` - Caching service
- `storage` - File storage operations
- `mailer` - Email sending
- `queue` - Background job queues
- `scheduler` - Task scheduling
- `cli` - Command-line interface

## Basic Usage

### Importing Facades

```ts
import { logger, cache, storage } from "@devbro/pashmak/facades";
```

### Using Facades

Pashmak facades support two calling patterns:

#### 1. Direct Method Access (Recommended)

```ts
import { logger, cache, storage } from "@devbro/pashmak/facades";

// Logger
logger.info("Application started"); // alias for logger('default').info()
logger.error({ msg: "Error occurred", error: err }); // alias for logger('default').error()

// Cache
await cache.put("key", "value"); // alias for cache('default').put()
const value = await cache.get("key"); // alias for cache('default').get()

// Storage
await storage.put("file.txt", "content"); // alias for storage('default').put()
const content = await storage.get("file.txt"); // alias for storage('default').get()
```

#### 2. Function Call Syntax

```ts
import { logger, cache, storage } from "@devbro/pashmak/facades";

// Logger
logger().info("Application started"); // alias for logger('default').info()

// Cache
await cache().put("key", "value"); // alias for cache('default').put()
const value = await cache().get("key"); // alias for cache('default').get()

// Storage
await storage().put("file.txt", "content"); // alias for storage('default').put()
const content = await storage().get("file.txt"); // alias for storage('default').get()
```

Both patterns access the same default instance and are functionally equivalent.

## Working with Multiple Instances

Many facades support labeled instances, allowing you to work with multiple configurations:

### Cache Example

```ts
// app/config/cache.ts
export default {
  default: {
    provider: "redis",
    config: { url: "redis://localhost:6379" },
  },
  shared_config: {
    provider: "redis",
    config: { url: "redis://localhost:6380" },
  },
};
```

```ts
import { cache } from "@devbro/pashmak/facades";

// Use default cache
await cache.put("user:1", userData);
await cache().put("user:2", userData2); // Same as above
await cache("default").put("user:2", userData2); // Same as above

// Use shared_config cache
await cache("shared_config").get("system_maintenance");
```

### Storage Example

```ts
// app/config/storage.ts
export default {
  default: {
    provider: "local",
    config: { basePath: "/var/app/storage" },
  },
  uploads: {
    provider: "s3",
    config: { bucket: "my-uploads" },
  },
};
```

```ts
import { storage } from "@devbro/pashmak/facades";

// Use default storage
await storage.put("logs/app.log", logData);

// Use uploads storage
await storage("uploads").put("images/photo.jpg", imageBuffer);
```

### Database Example

The `db` facade is slightly different as it's context-aware:

```ts
import { db } from "@devbro/pashmak/facades";

// Use default database connection
const users = await db().select("*").from("users");

// Use a specific labeled connection
const analytics = await db("analytics").select("*").from("events");
```

### Logger Example

```ts
// app/config/logger.ts
export default {
  default: {
    level: "info",
  },
  audit: {
    level: "debug",
  },
};
```

```ts
import { logger } from "@devbro/pashmak/facades";

// Use default logger
logger.info("Application event");

// Use audit logger
logger("audit").debug({ msg: "User action", userId: 123, action: "login" });
```

## Practical Examples

### Logger in Middleware

```ts
import { logger } from "@devbro/pashmak/facades";
import { Request, Response } from "@devbro/pashmak/router";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  logger.info({
    msg: "Incoming HTTP Request",
    method: req.method,
    url: req.url,
  });
  await next();
}
```

### Cache in Service

```ts
import { cache } from "@devbro/pashmak/facades";

export class UserService {
  async getUserById(id: number) {
    // Try to get from cache first
    const cached = await cache.get(`user:${id}`);
    if (cached) return cached;

    // Fetch from database
    const user = await db().select("*").from("users").where("id", id).first();

    // Store in cache for 1 hour
    await cache.put(`user:${id}`, user, 3600);

    return user;
  }
}
```

### Storage in Controller

```ts
import { Controller, Post } from "@devbro/pashmak/router";
import { storage } from "@devbro/pashmak/facades";
import { ctx } from "@devbro/pashmak/context";
import { Request } from "@devbro/pashmak/router";

@Controller("/api/uploads")
export class UploadController {
  @Post("/")
  async upload() {
    const req = ctx().get<Request>("request");
    const file = req.body.file;

    // Save to storage
    await storage("uploads").put(file.name, file.buffer);

    return { success: true, filename: file.name };
  }
}
```

### Multiple Facades Together

```ts
import { logger, cache, db } from "@devbro/pashmak/facades";

export async function getCachedData(key: string) {
  try {
    // Check cache first
    const cached = await cache.get(key);
    if (cached) {
      logger.debug({ msg: "Cache hit", key });
      return cached;
    }

    // Fetch from database
    logger.debug({ msg: "Cache miss, fetching from DB", key });
    const data = await db().select("*").from("data").where("key", key).first();

    // Store in cache
    if (data) {
      await cache.put(key, data, 3600);
    }

    return data;
  } catch (error) {
    logger.error({ msg: "Error fetching data", key, error });
    throw error;
  }
}
```

## How Facades Work

Under the hood, Pashmak facades use the `createSingleton` helper combined with `wrapSingletonWithAccessors` to provide their dual syntax:

1. **Singleton Management**: Each facade maintains a single instance (per label) that's created on first access
2. **Lazy Initialization**: Instances are only created when you first use them
3. **Property Accessors**: Methods are automatically proxied to the default instance
4. **Context Integration**: Some facades (like `db`) integrate with Pashmak's context system

This design gives you the convenience of static access with the flexibility of dependency injection and testing.

## Best Practices

### 1. Use Direct Method Access

The direct method syntax is cleaner and more readable:

```ts
// Good
logger.info("Message");
await cache.put("key", "value");

// Also works, but more verbose
logger().info("Message");
await cache().put("key", "value");
```

### 2. Use Labeled Instances for Separation

When you have different use cases, create labeled instances:

```ts
// Good - separate concerns
await cache("sessions").put(sessionId, sessionData);
await cache("api").put(cacheKey, apiResponse);

// Avoid - mixing concerns in default instance
await cache().put(`session:${sessionId}`, sessionData);
await cache().put(`api:${cacheKey}`, apiResponse);
```

### 3. Configure in Config Files

Always configure facades in your config files rather than inline:

```ts
// Good - app/config/cache.ts
export default {
  default: { provider: "redis", config: { url: process.env.REDIS_URL } },
};

// Avoid - inline configuration
// Not supported by facades
```

### 4. Consistent Import Style

Import all facades from the same location:

```ts
// Good
import { logger, cache, storage } from "@devbro/pashmak/facades";

// Avoid
import { logger } from "@devbro/pashmak/facades";
import { cache } from "@devbro/pashmak/facades";
import { storage } from "@devbro/pashmak/facades";
```

## Testing with Facades

Facades are designed to be testable. In tests, you can:

1. Import facades normally - they'll use test configurations
2. Mock facade methods when needed
3. Use different labeled instances for test isolation

```ts
import { describe, test, expect } from "vitest";
import { cache } from "@devbro/pashmak/facades";

describe("UserService", () => {
  test("should cache user data", async () => {
    // Facades work normally in tests
    await cache.put("test:user:1", { id: 1, name: "Test" });
    const cached = await cache.get("test:user:1");

    expect(cached).toEqual({ id: 1, name: "Test" });
  });
});
```

## Related Documentation

- [Logger](./logger.md) - Detailed logging documentation
- [Cache](./cache.md) - Caching strategies and providers
- [File Storage](./file-storage.md) - Storage operations and providers
- [Email](./email.md) - Mailer configuration and usage
- [Queue](./queue.md) - Background job processing
- [Scheduler](./scheduler.md) - Task scheduling
- [Context](./context.md) - Understanding Pashmak's context system
