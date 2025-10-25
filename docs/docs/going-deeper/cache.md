---
sidebar_position: 8
---

# Cache

Caching is a mechanism for storing data in a temporary storage area to reduce the time it takes to access that data in the future.

ttl: Time To Live, how long a cache value will be kept for.

## Basic usage

```ts
import { cache } from "@devbro/pashmak/facades";

await cache().put("my_key", value);
await cache().put("my_key2", value2, 3600 * 24); // 1 full day

const user = await cache.get("my_key");
```

### put

to store a value in cache. value must be a primitive type or a simple JSON type.
A simple JSON type is a type where all keys are string, and all values are either primitive values or simple Json. make sure your json does not have recurive or resource/buffer/stream types.

```ts
import { JSONObject, JSONValue } from "@devbro/pashmak/helpers";

let value: JSONObject | JSONValue;
await cache().put("my_key", value, ttl);
```

### has

If you want to test if a given key exists in cache

```ts
await cache().put("my_key");
```

### get

to get a value from inside cache. If key exists, value will be returned.
if cache does not exists or expired, you will get `undefined`.

```ts
await cache().get("my_key");
```

### delete

to remove a cache that is not expired yet.

```ts
await cache().delete("my_key");
```

### remember

there may be situations that you want to recalculate your cache using a function and get the value at the same time. This is where you can use `remember`

```ts
let val = await cache().remember(
  "my_key",
  async () => {
    return expensiveFunction();
  },
  { ttl: 600 },
);
```

## Available cache providers

Different providers are available off the shelf that you can use. depending on which provider you use different configs/options can be passed to it.

### memory

The memory cache provider stores data in the application's memory. This is the fastest cache provider but data is lost when the application restarts.

```ts
// app/config/cache.ts

export default {
  cache: {
    default: {
      type: "memory",
      config: {
        maxSize: 1000, // Maximum number of items to store (default: 1000)
        defaultTTL: 3600, // Default TTL in seconds (default: 1 hour)
        cleanupInterval: 600, //how often garbage collect expired cache
      },
    },
  },
};
```

### file

The file cache provider stores data in the filesystem as JSON files. This provides persistence across application restarts but is slower than memory cache.

```ts
// app/config/cache.ts

export default {
  cache: {
    default: {
      type: "file",
      config: {
        cacheDirectory: "./cache", // Cache directory (default: './cache')
        defaultTTL: 3600, // Default TTL in seconds (default: 1 hour)
        cleanupInterval: 600, //how often garbage collect expired cache
      },
    },
  },
};
```

#### redis

The Redis cache provider uses Redis as the caching backend. This provides high-performance caching with persistence and can be shared across multiple application instances.

```ts
// app/config/cache.ts

export default {
  cache: {
    default: {
      type: "redis",
      config: {
        // type: RedisClientOptions
        url: "redis://redis:6379",
      },
    },
  },
};
```

for more advance options please check RedisClientOptions

### memcache

The Memcache cache provider uses Memcached as the caching backend. Memcached is a high-performance, distributed memory caching system ideal for speeding up systems with distributed memory caching(cache is done in RAM not harddrive).

```ts
// app/config/cache.ts

export default {
  cache: {
    default: {
      type: "memcache",
      config: {
        location: ["memcache:11211"], // type Memcached.Location
        options: {}, // type Memcached.options
      },
    },
  },
};
```

### Disabled Provider

If you want to disable caching entirely, you can use the disabled cache provider. This provider does not store any data and all cache operations are no-ops.

```ts
// app/config/cache.ts
export default {
  cache: {
    default: {
      type: "disabled",
    },
  },
};
```

### Your own Provider

To create your own Cache driver, you can implement CacheProviderInterface and then register with CacheProviderFactory.

```ts
import { CacheProviderInterface } from '../CacheProviderInterface.mjs';
import { JSONValue, JSONObject } from '@devbro/neko-helper';

export class MyCacheProvider implements CacheProviderInterface {
  constructor(private config: MyConfig) {
  }

  async get(key: string): Promise<JSONValue | JSONObject | undefined> {
    ???
  }

  async put(key: string, value: JSONValue | JSONObject, ttl?: number): Promise<void> {
    ???
  }

  async delete(key: string): Promise<void> {
    ???
  }

  async has(key: string): Promise<boolean> {
    ???
  }

  async incr(key: string, value: number) Promise<number> {
    ???
  }
}


CacheProviderFactory.register("my_cache", (opt) => {
  return new FileCacheProvider(opt);
});
```

## Advanced usage

### cacheQuery

If you want to cache your queries to save time, use the `cacheQuery` function.

```ts
import { cacheQuery } from "@devbro/pashmak/cache";

let q: Query = User.getQuery().where("age", ">", 18);

const users = await cacheQuery(q);
const users2 = await cacheQuery(q, { ttl: 600 }); // uses cache('default')
const users3 = await cacheQuery(q, { ttl: 600, cache_label: "my_redis_cache" }); // uses cache('my_redis_cache')
```

## Registering your own Provider

TODO: add how to do it
