---
sidebar_position: 5
---

# Logger

Pashmak provides a simplified logging system built on top of Pino, allowing you to record important information during execution.

## Configuration

```ts
// app/config/logger.ts
import { ctxSafe } from "@devbro/pashmak/context";

export default {
  default: {
    level: "info",
    extrasFunction: (message: any) => {
      let requestId = ctxSafe()?.get("requestId");
      requestId && (message.requestId = requestId);
      return message;
    },
  },
};
```

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

## Multiple Loggers

Currently there is no built-in way to define multiple loggers with different providers. To achieve this, you can define multiple pino configurations and use them as needed.

```ts
// config/logger.ts
import { ctxSafe } from '@devbro/pashmak/context';

export default {
  default: {
    level: 'error',
    extrasFunction: (message: any) => {
      let requestId = ctxSafe()?.get('requestId');
      requestId && (message.requestId = requestId);
      return message;
    },
  },
  soc2logs: {
    level: 'info',
    extrasFunction: (message: any) => {
      let requestId = ctxSafe()?.get('requestId');
      message.extra_details = ???;
      return message;
    },
  },
};
```

Then use them in your code:

```ts
import { logger } from "@devbro/pashmak/facades";

logger().info("Standard log");
logger("soc2logs").error("Error log");
```

## extrasFunction

Sometimes you want to globally add details to all your LogMessages. to do this pass option
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
