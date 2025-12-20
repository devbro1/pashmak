---
sidebar_position: 2
---

# Configuration

Under the hood, we are using [neko-config](https://www.npmjs.com/package/@devbro/neko-config) library to help with managing configuration.

By default configs are loaded from `src/config/default.ts` file as a single object. To modify this behavior, you can modify `src/initialize.ts` file.

You can then access your configurations anywhere in your code like this:

```typescript
import { config } from "@devbro/pashmak/config"; // notice lower case 'c'

console.log(config.get("databases"));
```

it may become needed to load some values from envvars. to do this, use this approach:

```ts
import { getEnv } from "@devbro/pashmak/helper";
// config/default.ts
export default {
  port: process.env.PORT || 3000, // classic way
  https_port: getEnv("HTTPS_PORT", 443), // better way
};
```

## Organizing Configurations

Different features depend on configurations to run successfully, such as database, cache, storage, etc. To maintain clean and organized configurations:

1. Keep configurations for each feature/service in separate files
2. Import them into your default config using `loadConfig('file_name_without_extension')`
3. If using .ts, .js, .mjs, or .mts files, ensure they export default objects. Other possible extensions are .json, .yaml, and .yml which do not require default exports.
4. for facades that can provide multiple connections (like databases, caches, etc.), the main config must be called default.

An example for databases:

```ts
// config/databases.ts or config/database.js
export default {
  default: {
    provider: 'postgresql',
    config: {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'mydb',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    },
  },
  analytics: {
    provider: 'sqlite',
    config: {
      filename: './analytics.db',
      readonly: false,
    },
  },
  west_db: {
    provider: 'mysql',
    config: {
      // MySQL config here
    },
  },
};

// config/default.ts
export default {
  databases: loadConfig('databases'),
  cache: await loadConfig('cache'), // await keyword is optional since pashmak supports async configs
  // ... other configs
};
```

### Database Provider Configurations

#### PostgreSQL Configuration

```ts
{
  provider: 'postgresql',
  config: {
    host: 'localhost',
    database: 'mydb',
    user: 'postgres',
    password: 'password',
    port: 5432,
    ssl: false,              // Enable SSL (default: false)
    max: 20,                 // Max pool size (default: 20)
    idleTimeoutMillis: 1,    // Time before closing idle connection (default: 1)
    connectionTimeoutMillis: 30000, // Timeout for acquiring connection (default: 30000)
    maxUses: 7500,           // Max uses before connection refresh (default: 7500)
  }
}
```

#### SQLite Configuration

```ts
{
  provider: 'sqlite',
  config: {
    filename: './database.db',  // Path to database file (required)
    readonly: false,            // Open in readonly mode (default: false)
    fileMustExist: false,       // Database file must exist (default: false)
    timeout: 5000,              // Busy timeout in ms (default: 5000)
  }
}
```

## NODE_ENV Based Configurations

It is possible to mix and match different configuration files based on the `NODE_ENV` value. Simply export `$NODE_ENV` named exports from your configuration files. If a matching export is found, it will be merged with the default export.

```typescript
// config/payment.ts
export default {
  provider: "stripe",
  apiKey: "PLEASE_REPLACE_ME",
  webhookSecret: "PLEASE_REPLACE_ME",
};

// NODE_ENV = 'dev'
export const $dev = {
  apiKey: "sk_dev_XXXXXXXXXXXXXXXXXXXX",
  webhookSecret: "whsec_dev_XXXXXXXXXXXXXXXXXXXX",
};

// NODE_ENV = 'test'
export const $test = {
  provider: "stripe",
  apiKey: "sk_test_XXXXXXXXXXXXXXXXXXXX",
  webhookSecret: "whsec_test_XXXXXXXXXXXXXXXXXXXX",
};

// NODE_ENV = 'prod'
export const $prod = {
  provider: "stripe",
  apiKey: process.env.STRIPE_API_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};
```

## .env AKA dotenv

There is also .env support in case you want to load some configs that way. please note, you will still need to add the specific configs you want to default.js to be able to access the values.

## Enforce values for config to exists

some configs are essential and you want to stop the process without them. If these values need to come from envar, you can do this:

```ts
import { getEnv } from "@devbro/pashmak/helper";

export default {
  https_port: getEnv("HTTPS_PORT", 443), // will return 443 if not defined
  port: getEnv("PORT"), // will throw an error if PORT is not defined
  ssh_port: getEnv("SSH_PORT", undefined), // will return undefined if not defined
};
```
