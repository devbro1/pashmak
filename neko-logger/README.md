# @devbro/neko-logger

simpler wrapper for uniform logging functionality.

## example

```ts
import { Logger } from '@devbro/neko-logger';

let logger = new Logger();

logger.info('my log message');

logger.info({ msg: 'my second log message', details: {}, requestId: 10, error: err });
```
