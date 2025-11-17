---
sidebar_position: 7
---

# Queue and Messaging

The concept of the queue is to allow messages to be sent using connections an queue.

## connection vs queue

concept of Connection is like a server/service that can handle multiple queues. Think of RabbitMQ server that can handle multiple queues.

queue is a channel inside a connection that can handle messages.

## Configuration

```ts
// app/config/queues.ts
export default {
  queues: {
    default: {
      type: "database",
    },
  },
};
```

## How messaging works

unlike traditional approaches where you send string. Pashmak Queue works with objects:

```ts
import { queue } from '@devbro/pashmak/facades';
import { QueueMessageInterface } from '@devbro/pashmak/queue';

export class IncomingWebhookMessage implements QueueMessageInterface {

  /**
   * Method to convert Message to string.
   * keep in mind this string should be able to be converted back to Message object.
   */
  async getMessage(): Promise<string> {
    return JSON.stringify({...this.something, ...this.somethingElse});
  }

    /**
     * Method to set message from string or object.
     */
  async setMessage(value: string | Record<string, any>): Promise<void> {
    ???
    this.something = ???;
    this.somethingElse = ???;
  }

/**
 * Method to validate message before processing.
 * return true if message is valid, false otherwise.
 * It is to prevent processing invalid messages.
 */
  async validateMessage(): Promise<Boolean> {
    return true;
  }

  async processMessage(): Promise<void> {
    // process the message here
  }

    /**
     * Send the message to a queue.
     */
  async dispatch() {
    queue().dispatch('stripe_incoming_webhook', this);
  }
}
```

## Available drivers:

#### Database

Uses database to store messages. This is the default driver and requires a table in your database.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    # Create a migration for queue table
    pashmak generate queue migration
    # Then run migrations
    pashmak migrate
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    # Create a migration for queue table
    pashmak generate queue migration
    # Then run migrations
    pashmak migrate
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    # Create a migration for queue table
    pashmak generate queue migration
    # Then run migrations
    pashmak migrate
    ```
  </TabItem>
</Tabs>

```ts
// app/config/queues.ts
import { DatabaseTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      provider: "database",
      config: {
        ???
      } as DatabaseTransportConfig,
    },
};
```

#### Memory (In-Memory)

The memory transport stores messages in memory and is ideal for development, testing, or simple applications that don't require persistence.

```ts
// app/config/queues.ts
export default {
  queues: {
    default: {
      provider: "memory",
      config: {
        interval: 10_000, // Interval to check for new messages (ms)
      },
    },
  },
};
```

#### Async Transport

The async transport processes messages asynchronously within the application, allowing for non-blocking operations and improved performance. Unlike memory transport, it will execute messages right away without waiting for an interval. Ideal for testing and development.

```ts
// app/config/queues.ts
import { AsyncTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      provider: "async",
      config: {
        ???
      } as AsyncTransportConfig,
    },
};
```

#### SQS (Amazon Simple Queue Service)

Uses AWS SQS service for reliable, scalable message queuing. Requires AWS credentials and proper IAM permissions.

```ts
// app/config/queues.ts
import { AwsSqsTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      provider: "sqs",
      config: {
        ???
      } as AwsSqsTransportConfig,
    },
};
```

#### AMQP (RabbitMQ, BullMQ)

Uses AMQP protocol to connect to RabbitMQ or other AMQP-compatible message brokers. Provides advanced routing and exchange patterns.

```ts
// app/config/queues.ts
import { AmqpTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      provider: "amqp",
      config: {
        ???
      } as AmqpTransportConfig,
    },
};
```

#### Redis

Uses Redis lists and pub/sub for fast, lightweight message queuing with optional retry and dead-letter queue support.

```ts
// app/config/queues.ts
import { RedisTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      provider: "redis",
      config: {
        ???
      } as RedisTransportConfig,
    },
};
```

#### Google Cloud Pub/Sub

Uses Google Cloud Pub/Sub for globally distributed message queuing with automatic scaling and high availability.

```ts
// app/config/queues.ts
import { GooglePubSubTransportConfig } from '@devbro/pashmak/queue';

export default {
    default: {
      type: "pubsub",
      config: {
        ???
      } as GooglePubSubTransportConfig,
    },
};
```

#### Azure Service Bus

Uses Azure Service Bus for enterprise-grade message queuing with advanced features like sessions, transactions, and message scheduling.

```ts
// app/config/queues.ts
import { AzureServiceBusTransportConfig } from '@devbro/pashmak/queue';

export default {
  default: {
    provider: "azure_service_bus",
    config: {
      ???
    } as AzureServiceBusTransportConfig,
  },
};
```

## Registering your own Provider

You can create custom queue transports by implementing the `QueueTransportInterface`:

```ts
import { QueueTransportInterface } from "@devbro/pashmak/queue";

export class CustomTransport implements QueueTransportInterface {
  /**
   * Dispatch a message to a specific channel
   */
  async dispatch(channel: string, message: string): Promise<void> {
    // Your implementation
  }

  /**
   * Register a listener callback for a channel
   */
  async registerListener(
    channel: string,
    callback: (message: string) => Promise<void>,
  ): Promise<void> {
    // Your implementation
  }

  /**
   * Start listening for messages on all registered channels
   */
  async startListening(): Promise<void> {
    // Your implementation
  }

  /**
   * Stop listening and cleanup resources
   */
  async stopListening(): Promise<void> {
    // Your implementation
  }
}
```

Then register your custom transport in the queue factory:

```ts
import { QueueTransportFactory } from "@devbro/pashmak/queue";
import { CustomTransport } from "./CustomTransport";

// Register your transport
QueueTransportFactory.register("custom", (config) => {
  return new CustomTransport(config);
});

// Use it in your config
export default {
  queues: {
    default: {
      type: "custom",
      // Your custom configuration
    },
  },
};
```
