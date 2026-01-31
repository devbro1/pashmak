# @devbro/neko-config

A lightweight, type-safe configuration management library for Node.js and TypeScript applications. Part of the Neko and Pashmak ecosystem.

## Installation

```bash
npm install @devbro/neko-config
```

## Features

- 🎯 **Simple API** - Easy to use with intuitive methods
- 🔒 **Type-Safe** - Full TypeScript support with autocomplete
- 🌲 **Nested Access** - Access deeply nested values using dot notation
- 🔄 **Multiple Instances** - Support for multiple configuration instances
- 📦 **Singleton Pattern** - Default singleton instance for convenience
- 🎨 **Flexible** - Works with any JSON-like configuration structure

## Quick Start

### Loading Configuration

First, load your configuration data in your application entry point:

```ts
// loader.ts or app.ts
import { config } from '@devbro/neko-config';

const configData = {
  app: {
    name: 'MyApp',
    port: 3000,
    debug: true,
  },
  database: {
    primary: {
      host: 'localhost',
      port: 5432,
      uri: 'postgresql://localhost:5432/mydb',
    },
  },
  cache: {
    redis: [
      { uri: 'redis://localhost:6379/0' },
      { uri: 'redis://localhost:6379/1' },
      { uri: 'redis://localhost:6379/2' },
    ],
  },
};

config.load(configData);
```

### Basic Usage

Once loaded, you can access configuration values anywhere in your application:

```ts
import { config } from '@devbro/neko-config';

// Get a value with a default fallback
const port = config.get('app.port', 3000);

// Get a nested value
const dbHost = config.get('database.primary.host');

// Access array elements
const redisUri = config.get('cache.redis[2].uri');

// Check if a key exists
if (config.has('app.debug')) {
  console.log('Debug mode is configured');
}

// Get the entire configuration object
const allConfig = config.all();
```

## Advanced Features

### Typed Configuration Keys

For enhanced type safety and autocomplete, you can define your configuration schema using TypeScript module augmentation. This is especially useful in larger projects where you want to catch configuration errors at compile time.

#### Step 1: Define Your Configuration Types

Create a type declaration file (e.g., `types/config.d.ts` or `src/config.d.ts`):

```ts
// types/config.d.ts
declare module '@devbro/neko-config' {
  interface ConfigKeys {
    '$.app.name': string;
    '$.app.port': number;
    '$.app.debug': boolean;
    '$.database.host': string;
    '$.database.port': number;
    '$.database.username': string;
    '$.database.password': string;
    '$.cache.redis[0].uri': string;
    '$.api.baseUrl': string;
    '$.api.timeout': number;
  }
}
```

#### Step 2: Enjoy Type Safety

After defining your typed keys, TypeScript will provide full autocomplete and type checking:

```ts
import { config } from '@devbro/neko-config';

// ✅ TypeScript knows this is a string - full autocomplete!
const appName = config.get('$.app.name');

// ✅ TypeScript knows this is a number
const port = config.get('$.app.port');

// ✅ Type inference works with default values
const timeout = config.get('$.api.timeout', 5000); // number

// ❌ TypeScript will show an error for undefined keys
// const invalid = config.get('$.app.nonexistent'); // Error!

// 💡 You can still use dynamic keys when needed
const dynamicKey = config.get('$.some.dynamic.path' as any);
```

**Benefits of Typed Configuration:**

- **Autocomplete**: Your IDE will suggest available configuration keys
- **Type Safety**: Catch typos and missing keys at compile time
- **Documentation**: Configuration schema serves as self-documenting code
- **Refactoring**: Safely rename or restructure configuration keys

> **Note**: If you don't augment the `ConfigKeys` interface, the library accepts any string key (default behavior), providing maximum flexibility.

### Multiple Configuration Instances

While the singleton `config` instance is convenient for most use cases, you can create multiple independent configuration instances when needed. This is useful for:

- Testing with different configurations
- Multi-tenant applications
- Isolating configuration scopes

```ts
import { Config } from '@devbro/neko-config';

// Create separate configuration instances
const appConfig = new Config();
appConfig.load({
  environment: 'production',
  features: { newUI: true },
});

const testConfig = new Config();
testConfig.load({
  environment: 'test',
  features: { newUI: false },
});

// Each instance maintains its own state
console.log(appConfig.get('environment')); // 'production'
console.log(testConfig.get('environment')); // 'test'
```

## API Reference

### `Config` Class

#### Methods

##### `load(data: object): void`

Load configuration data into the instance.

```ts
config.load({ app: { name: 'MyApp' } });
```

##### `get<T = any>(key: string, defaultValue?: T): T`

Retrieve a configuration value by key. Returns the default value if the key doesn't exist.

```ts
const port = config.get('app.port', 3000);
const name = config.get<string>('app.name');
```

##### `has(key: string): boolean`

Check if a configuration key exists.

```ts
if (config.has('database.uri')) {
  // Configuration exists
}
```

##### `all(): object`

Get the entire configuration object.

```ts
const allConfig = config.all();
```

### Dot Notation

The library supports flexible dot notation for accessing nested values:

```ts
// Object properties
config.get('database.primary.host');

// Array elements
config.get('servers[0].url');

// Mixed
config.get('services.api.endpoints[0].path');
```

## Best Practices

1. **Load Early**: Load your configuration as early as possible in your application lifecycle
2. **Use Types**: Define typed configuration keys for better developer experience
3. **Environment Variables**: Combine with environment variables for different deployment environments
4. **Default Values**: Always provide sensible defaults when calling `get()`
5. **Validation**: Validate critical configuration values after loading

## Example: Complete Setup

```ts
// config/index.ts
import { config } from '@devbro/neko-config';
import fs from 'fs';
import path from 'path';

// Load configuration from file
const configPath = path.join(__dirname, 'config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Merge with environment variables
const finalConfig = {
  ...configData,
  app: {
    ...configData.app,
    port: process.env.PORT || configData.app.port,
    env: process.env.NODE_ENV || 'development',
  },
};

config.load(finalConfig);

// Export for use in other modules
export { config };
```

```ts
// app.ts
import { config } from './config';

const port = config.get('app.port', 3000);
const appName = config.get('app.name');

console.log(`Starting ${appName} on port ${port}`);
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Packages

- [@devbro/neko-cache](https://www.npmjs.com/package/@devbro/neko-cache) - Caching solution
- [@devbro/neko-logger](https://www.npmjs.com/package/@devbro/neko-logger) - Logging utilities
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
