# @devbro/neko-cache

A flexible and customizable caching solution for Node.js and bun applications with support for multiple providers.

## Installation

```bash
npm install @devbro/neko-cache
```

## Features

- Multiple cache providers (Redis, Memory, etc.)
- Simple and intuitive API
- TypeScript support
- Async/await support
- TTL (Time To Live) support
- Key prefixing and namespacing

## Usage

### Basic Example

```ts
import { CacheManager } from '@devbro/neko-cache';

// Create a cache instance
const cache = new CacheManager();

// Set a value
await cache.set('key', 'value', 3600); // TTL in seconds

// Get a value
const value = await cache.get('key');

// Delete a value
await cache.delete('key');

// Clear all cache
await cache.clear();
```

### Advanced Usage

```ts
import { CacheManager, MemoryProvider } from '@devbro/neko-cache';

// Create cache with custom provider
const cache = new CacheManager({
  provider: new MemoryProvider(),
  prefix: 'myapp:',
});

// Check if key exists
const exists = await cache.has('key');

// Get multiple values
const values = await cache.getMany(['key1', 'key2', 'key3']);

// Set multiple values
await cache.setMany(
  {
    key1: 'value1',
    key2: 'value2',
  },
  3600
);

// Delete multiple keys
await cache.deleteMany(['key1', 'key2']);
```

## API Reference

### `CacheManager`

#### Methods

- `get(key: string): Promise<any>` - Retrieve a value from cache
- `set(key: string, value: any, ttl?: number): Promise<void>` - Store a value in cache
- `has(key: string): Promise<boolean>` - Check if a key exists
- `delete(key: string): Promise<void>` - Remove a value from cache
- `clear(): Promise<void>` - Clear all cached values
- `getMany(keys: string[]): Promise<any[]>` - Retrieve multiple values
- `setMany(items: Record<string, any>, ttl?: number): Promise<void>` - Store multiple values
- `deleteMany(keys: string[]): Promise<void>` - Remove multiple values

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
