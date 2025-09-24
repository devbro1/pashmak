export * from "@devbro/neko-cache";

import { Query } from "@devbro/neko-sql";
import { cache } from "./facades.mjs";
import * as crypto from "crypto";

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

  const key = crypto
    .createHash("md5")
    .update(`sql_cache:${sql.sql}:${sql.bindings.join(",")}`)
    .digest("hex");
  const cachedResult = (await cache(options.cache_label).get(key)) as
    | string
    | undefined;
  if (cachedResult) {
    return JSON.parse(cachedResult);
  }

  const rc = await q.get();
  await cache(options.cache_label).put(key, JSON.stringify(rc), options.ttl);
  return rc;
}
