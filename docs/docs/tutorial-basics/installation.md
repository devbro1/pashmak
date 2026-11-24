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
  <TabItem value="bun" label="Bun">
    ```bash
    bun add -g @devbro/pashmak
    ```
  </TabItem>
</Tabs>

The CLI runs on Node.js by default. To run it on Bun instead, add `--bun`, e.g. `bun --bun pashmak create project`, or without installing: `bunx --bun @devbro/pashmak create project`.

## Create a New Project

Use the Pashmak CLI to create a new project:

```bash
pashmak create project
cd /path/to/project
```

The command prompts for the project path, executor, package manager and libraries. Run `pashmak --help` to list available commands.

## Install Dependencies and setup

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install
    npm run pdev migrate
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn install
    yarn pdev migrate
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm install
    pnpm run pdev migrate
    ```
  </TabItem>
</Tabs>

## Start Development Server

To start the development server with all services (HTTP server, scheduler, and queues):

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm run pdev start --all
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn pdev start --all
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm run pdev start --all
    ```
  </TabItem>
</Tabs>

## Build and Run for Production

Pashmak has good performance with regular start command.
If you plan on running for production and want to maximize performance, use minified code,
and optimize size of the build, you can use the build command:

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
