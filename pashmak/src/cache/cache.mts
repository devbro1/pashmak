export * from "@devbro/neko-cache";

import type { JSONValue } from "@devbro/neko-helper";
import type { Query } from "@devbro/neko-sql";
import { cache } from "../facades.mjs";

export type CacheQueryOptions = {
  ttl?: number;
  tags?: string[];
  cache_label?: string;
};

export async function cacheQuery(
  q: Query,
  options: CacheQueryOptions = {},
): ReturnType<Query["get"]> {
  options.ttl = options.ttl ?? 3600; // default TTL 1 hour
  options.cache_label = options.cache_label ?? "default";
  const sql = q.toSql();

  return await cache(options.cache_label).remember(
    sql as JSONValue,
    async () => await q.get(),
    options,
  );
}
