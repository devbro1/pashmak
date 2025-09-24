---
sidebar_position: 8
---

# Cache

Caching is a mechanism for storing data in a temporary storage area to reduce the time it takes to access that data in the future.

## configuration

## Basic usage

### store

### has

### get

### delete

### remember

## Available cache providers

#### memory

#### redis

#### file

## Advanced usage

### cacheQuery

If you want to cache your queries to save time, use the `cacheQuery` function.

```ts
import { cacheQuery } from "@devbro/pashmak/cache";

let q: Query = User.getQuery().where("age", ">", 18);

const users = await cacheQuery(q);
const users2 = await cacheQuery(q, { ttl: 600 }); // use cache('default')
const users3 = await cacheQuery(q, { ttl: 600, cache_label: "my_redis_cache" });
```
