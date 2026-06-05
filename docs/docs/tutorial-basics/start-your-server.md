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

- `--all`: Start all services
- `--http`: Start only the HTTP server
- `--scheduler` / `--all-crons`: Start all scheduler jobs
- `--cron <name>`: Start selected cron jobs (supports wildcards)
- `--all-queues`: Start all queue listeners
- `--queue <name>`: Start selected queue listeners (supports wildcards, use `connection:queue` for non-default connections)
