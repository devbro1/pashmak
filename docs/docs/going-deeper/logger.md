---
sidebar_position: 5
---

# Loggers

you can use log to record details you need during various parts of execution:

```ts
import { logger } from "@root/facades";

logger().info("info green message");
logger().warn("warning yellow message");
logger().error("error red message");
logger().fatal("fatal black message");
logger().trace("trace white message");
logger().debug("debug gray message");
```

these would produce proper log messages in json format to stdout.

## detailed logs

if you need to capture more details in your logs, you can always pass an object instead:

```ts
logger().info({ msg: "my message", err: error });
// or
logger().info("my message", { err: error });
```

## multiple loggers

if you want to have multiple loggers simply define different configs for each logger in config/logger.ts file.

Currently we are using Pino to generate logs. So passing any valid Pino config will work.

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
