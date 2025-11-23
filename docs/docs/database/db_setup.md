---
sidebar_position: 1
---

# Setup Database

## Configuration

If you are planning to connect to a database using Pashmak SQL library, first you need to define your db access:

```ts
// src/config/databases.ts

export default {
  default: {
    provider: "postgresql",
    config: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME || "test_db",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "5432"),
    },
  },
};

export const $test = {
  default: {
    provider: "postgresql",
    config: {
      host: process.env.TEST_DB_HOST,
      database: process.env.TEST_DB_NAME || "test_db",
      user: process.env.TEST_DB_USER,
      password: process.env.TEST_DB_PASSWORD,
      port: parseInt(process.env.TEST_DB_PORT || "5432"),
    },
  },
};
```

## Applying migrations

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

To initially setup your database and run migrations:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm run dev
    # Then in another terminal
    pashmak migrate
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn dev
    # Then in another terminal
    pashmak migrate
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm dev
    # Then in another terminal
    pashmak migrate
    ```
  </TabItem>
</Tabs>

## Eager vs Lazy Connection

Eager logic is where we do something ahead of when it is needed. For example database connection is opened at the beginning request processing to be ready for any database query that will be made. It is beneficial to improve performance at the risk of allocating resources that may not be used.

Pashmak takes the route of lazy logic when it comes to database. Connection to database is not established until the first query needs to run. If your request results in no query execution, no connection to database will be made. This is mainly useful to save resources and gives you opportunity to end a request if there are issues with the request such as bad authentication or invalid body.

If you want to enforce eager connection, you will need to define a new middleware and manually call `await db().connect();`
