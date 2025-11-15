---
sidebar_position: 5
---

# Logger

Pashmak provides a powerful logging system built on top of Pino, allowing you to record important information during execution.

## Basic Usage

```ts
import { logger } from "@devbro/pashmak/facades";

logger().info("info green message");
logger().warn("warning yellow message");
logger().error("error red message");
logger().fatal("fatal black message");
logger().trace("trace white message");
logger().debug("debug gray message");
```

These produce properly formatted log messages in JSON format to stdout.

## Detailed Logs

If you need to capture more details in your logs, you can pass an object:

```ts
import { logger } from "@devbro/pashmak/facades";

// Log with additional data
logger().info({ msg: "User logged in", userId: 123, ip: "192.168.1.1" });

// Log errors with context
logger().error({ msg: "Database connection failed", err: error });

// Alternative syntax
logger().info("my message", { err: error, context: "authentication" });
```

## Logging in Controllers

Example of using logger in a controller:

```ts
import { logger } from "@devbro/pashmak/facades";
import { BaseController, Controller, Post } from "@devbro/pashmak/router";
import { ctx } from "@devbro/pashmak/context";

@Controller("/api/v1/users")
export class UserController extends BaseController {
  @Post()
  async create() {
    const req = ctx().get("request");
    
    logger().info({
      msg: "Creating new user",
      body: req.body,
      ip: req.ip,
    });
    
    try {
      const user = await User.create(req.body);
      logger().info({ msg: "User created successfully", userId: user.id });
      return user;
    } catch (error) {
      logger().error({ msg: "Failed to create user", err: error });
      throw error;
    }
  }
}
```

## Multiple Loggers

You can define multiple logger configurations in your `config/logger.ts` file:

```ts
// config/logger.ts
export default {
  level: "info",
  // ... Pino configuration options
};

export const errorLogger = {
  level: "error",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
};

export const auditLogger = {
  level: "info",
  // Custom configuration for audit logs
};
```

Then use them in your code:

```ts
import { logger } from "@devbro/pashmak/facades";

logger().info("Standard log");
logger("errorLogger").error("Error log");
logger("auditLogger").info("Audit log");
```

## extrasFunction

Sometimes you want to globally add some details to all your LogMessages. to do this pass option
extraFunctions in your config:

```ts
import { ctxSafe } from "@devbro/pashmak/helper";
import { LogMessage } from "@devbro/pashmak/logger";

export default {
  extrasFunction: (message: LogMessage) => {
    let requestId = ctxSafe()?.get("requestId");
    requestId && (message.requestId = requestId);
    return message;
  },
};
```
