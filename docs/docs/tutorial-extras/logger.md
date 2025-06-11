---
sidebar_position: 4
---

# Loggers

you can use log to record details you need during various parts of execution:

```ts
import { logger } from "@root/facades";

logger().info("info message");
logger().warn("info message");
logger().error("info message");
logger().fatal("info message");
logger().trace("info message");
logger().debug("info message");
```

these would produce proper log messages in json format to stdout.

## detailed logs

if you need to capture more details in your logs, you can always pass an object instead:

```ts
loggeer().info({ msg: "my message", err: error });
```

## multiple loggers

if you want to have multiple loggers simply define different configs for each logger in config/logger.ts file.

Currently we are using Pino to generate logs. So passing any valid Pino config will work.

## extrasFunction

Sometimes you want to globally add some details to all your LogMessages. to do this pass option
extraFunctions in your config:

```ts
import { ctxSafe } from "neko-helper/src";
import { LogMessage } from "neko-logger/src";

export default {
  extrasFunction: (message: LogMessage) => {
    let requestId = ctxSafe()?.get("requestId");
    requestId && (message.requestId = requestId);
    return message;
  },
};
```
