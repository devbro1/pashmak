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
    npm run pdev start
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn pdev start
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm run pdev start
    ```
  </TabItem>
</Tabs>

## Start Individual Services

`pdev start` accepts flags to start indivitual services:

- `--all`: Start all services (default)
- `--http`: Start only the HTTP server
- `--scheduler`: Start only the scheduler
- `--queues`: Start only the queues
