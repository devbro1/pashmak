---
sidebar_position: 6
---

# Start Your Server

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Start All Services

To start the HTTP server, scheduler, and queues all together:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm run dev
    # or for production
    npm run start
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn dev
    # or for production
    yarn start
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm dev
    # or for production
    pnpm start
    ```
  </TabItem>
</Tabs>

## Start Individual Services

You can also start services individually using the Pashmak CLI:

### HTTP Server Only

```bash
pashmak start --http
```

### Scheduler Only

```bash
pashmak start --scheduler
```

### Queue Workers Only

```bash
pashmak start --queues
```

### All Services with CLI

```bash
pashmak start --all
```
