---
sidebar_position: 2
---

# Configuration

Under the hood, we are using [neko-config](https://www.npmjs.com/package/@devbro/neko-config) library to help with managing configuration.

To start place your related configs in `config/default.ts` file and it will be autoloaded.

```typescript
import { config } from "@devbro/pashmak/config";

console.log(config.get("databases"));
```

it may become needed to load some values from envvars. to do this, use this approach:

```javascript
// config/default.ts
export default {
  port: process.env.PORT || 3000,
};
```

## Organizing Configurations

Multiple features depend on configurations to run successfully, such as database, cache, storage, etc. To maintain clean and organized configurations:

1. Keep configurations for each feature in separate files
2. Import them into your default config using `await import()`
3. The main configuration for each service should be named `default`

For example, if your system connects to 3 different databases, the main database should be labeled `default`, and the others can have custom names:

```ts
// config/database.ts
export default {
  driver: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  // ... other database config
};

export const analyticsDb = {
  driver: 'postgres',
  host: process.env.ANALYTICS_DB_HOST,
  // ...
};

// config/default.ts
export default {
  databases: await import('./database.js'),
  cache: await import('./cache.js'),
  storage: await import('./storage.js'),
  // ... other configs
};
```

## Custom Feature Configurations

If you create a custom feature (e.g., payment processing) that needs configuration:

```typescript
// config/payment.ts
export default {
  provider: 'stripe',
  apiKey: process.env.STRIPE_API_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Optional: Add a secondary payment system
export const secondaryPayment = {
  provider: 'paypal',
  clientId: process.env.PAYPAL_CLIENT_ID,
  secret: process.env.PAYPAL_SECRET,
};

// config/default.ts
export default {
  // ... other configs
  payment: await import('./payment.js'),
};

// In your code
import { config } from '@devbro/pashmak/config';

if (config.get('payment.default.provider') === 'stripe') {
  // Standard payment processing
} else if (config.get('payment.secondaryPayment.provider') === 'paypal') {
  // Alternative payment processing
}
```

## .env AKA dotenv

there is also .env support in case you want to load some configs that way. please note, you will still need to add the specific configs you want to default.js to be able to access the values.

## Force config to exists

some configs are essential and you want to stop the process without them. If these values need to come from envar, you can do this:

```ts
import { getEnv } from "@devbro/pashmak/helper";

export default {
  https_port: getEnv("HTTPS_PORT", 443),
  port: getEnv("PORT"),
  ssh_port: getEnv("SSH_PORT", undefined),
};
```

if `PORT` is not defined, an error is thrown and stopping the process entirely before it starts.

if `HTTPS_PORT` is not defined, it will use default value of 443 and will not throw an error.

if `ssh_port` is not defined, it will use default value of `undefined` and will NOT throw an error.
