---
sidebar_position: 1
---

# Installation

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Install Pashmak CLI

First, install the Pashmak CLI globally:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install -g @devbro/pashmak
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn global add @devbro/pashmak
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm add -g @devbro/pashmak
    ```
  </TabItem>
</Tabs>

## Create a New Project

Use the Pashmak CLI to create a new project:

```bash
pashmak create project --path /path/to/project
cd /path/to/project
```

## Install Dependencies

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn install
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm install
    ```
  </TabItem>
</Tabs>

## Start Development Server

To start the development server with all services (HTTP server, scheduler, and queues):

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm run dev
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn dev
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm dev
    ```
  </TabItem>
</Tabs>

## Build and Run for Production

To do a complete build and then run in production:

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm run build
    npm run start
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn build
    yarn start
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm build
    pnpm start
    ```
  </TabItem>
</Tabs>
