---
sidebar_position: 1
---

# Setup Database

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

Or use the CLI directly:

```bash
pashmak migrate
```

## Migration Commands

### Run Migrations

Apply all pending migrations:

```bash
pashmak migrate
```

### Rollback Migrations

Undo the last migration:

```bash
pashmak migrate rollback
```

Undo the last X migrations:

```bash
pashmak migrate rollback --steps=3
```

### Refresh Migrations

Clean up the database by undoing all migrations, then reapply all available migrations:

```bash
pashmak migrate --refresh
```

### Fresh Migrations

Drop and recreate the database, then run all migrations (use with caution in production!):

```bash
pashmak migrate --fresh
```

## Creating Migrations

Generate a new migration file:

```bash
pashmak generate migrate --name=create_users_table
```

This will create a migration file in your `database/migrations` directory.