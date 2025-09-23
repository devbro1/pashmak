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

## Available drivers:

### database

uses database to store messages. This is the default driver and requires a table in your database.

```bash
# to create a migration for queue table
yarn pdev generate queue migration
```

### SQS

uses AWS SQS service to handle messages. You need to provide AWS credentials and region in your config.

### RabbitMQ

### Logger

### Async
