---
sidebar_position: 7
---

# Queue and Messaging

The concept of the queue is to allow messages to be sent using connections an queue.

## connection vs queue

concept of Connection is like a server/service that can handle multiple queues. Think of RabbitMQ server that can handle multiple queues.

queue is a channel inside a connection that can handle messages.

## Creating a connection

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

#### database

uses database to store messages. This is the default driver and requires a table in your database.

```bash
# to create a migration for queue table
yarn pdev generate queue migration
```

#### SQS

uses AWS SQS service to handle messages. You need to provide AWS credentials and region in your config.

#### RabbitMQ

#### Logger

#### Async
