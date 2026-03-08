import { Middleware, Request, Response } from "@devbro/neko-router";
import { logger, db, cache } from "./facades.mjs";
import { HttpTooManyRequestsError } from "@devbro/neko-http";
import { config } from "@devbro/neko-config";
import { Connection } from "@devbro/neko-sql";
import { Global } from './global.mjs';
import { ctx } from './context.mjs';
import { BaseModel } from "@devbro/neko-orm";
import { MysqlConnection, PostgresqlConnection, SqliteConnection, SqliteConfig, PostgresqlConfig, MysqlConfig } from "@devbro/neko-sql";

export function cors(
  options: { allowedOrigins?: (string | RegExp)[] } = {},
): (req: Request, res: Response, next: () => Promise<void>) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> => {
    const allowedOrigins = options.allowedOrigins || ["*"];
    const origin = req.headers.origin || "*";

    for (const allowedOrigin of allowedOrigins) {
      if (typeof allowedOrigin === "string" && allowedOrigin === origin) {
        res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        break;
      } else if (
        allowedOrigin instanceof RegExp &&
        allowedOrigin.test(origin)
      ) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        break;
      } else if (allowedOrigin === "*") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        break;
      }
    }

    res.setHeader("Access-Control-Allow-Headers", "*");
    await next();
  };
}

export async function dbTransaction(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  try {
    await db().beginTransaction();
    await next();
    await db().commit();
  } catch (err) {
    await db().rollback();
    throw err;
  }
}

export type RateLimiterMiddlewareParams = {
  generateIdentifier: (req: Request) => string;
  maxRequests: number;
  windowTimeSize: number;
  windowCount: number;
};

/**
 * Rate limiter middleware using a sliding window algorithm.
 *
 * This middleware tracks request counts across multiple time windows to prevent abuse.
 * It uses atomic cache increments to ensure accurate counting in concurrent environments.
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (200 requests per 2 minutes)
 * authnedRouter.addGlobalMiddleware(RateLimiterMiddleware);
 *
 * // Custom configuration
 * authnedRouter.addGlobalMiddleware(RateLimiterMiddleware.getInstance({
 *   generateIdentifier: (req) => req.headers['x-api-key'] || req.socket.remoteAddress,
 *   maxRequests: 200,      // Allow 200 requests
 *   windowTimeSize: 30,    // in 30 second windows
 *   windowCount: 4         // looking back 4 windows (total: 120 seconds)
 * }));
 * ```
 *
 * @param params.generateIdentifier - Function to generate unique identifier for rate limiting (default: IP address)
 * @param params.maxRequests - Maximum number of requests allowed across all windows (default: 200)
 * @param params.windowTimeSize - Size of each time window in seconds (default: 30)
 * @param params.windowCount - Number of previous windows to check (default: 4)
 *
 * The total time period checked is `windowTimeSize * windowCount` seconds.
 * Default configuration: 200 requests per 120 seconds (30s × 4 windows).
 *
 * @throws {HttpTooManyRequestsError} When rate limit is exceeded
 */
export class RateLimiterMiddleware extends Middleware {
  static singletonInstance: Middleware | undefined = undefined;
  static getInstance(
    params: Partial<RateLimiterMiddlewareParams> = {},
  ): Middleware {
    if (RateLimiterMiddleware.singletonInstance) {
      return RateLimiterMiddleware.singletonInstance;
    }
    let default_params: RateLimiterMiddlewareParams = {
      generateIdentifier: (req: Request) =>
        req.socket.remoteAddress || "unknown",
      maxRequests: 200,
      windowTimeSize: 30,
      windowCount: 4,
    };
    const merged_params = { ...default_params, ...params };
    return (RateLimiterMiddleware.singletonInstance = new RateLimiterMiddleware(
      merged_params,
    ));
  }

  constructor(private params: RateLimiterMiddlewareParams) {
    super();
  }

  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    let window = parseInt(
      (Date.now() / 1000 / this.params.windowTimeSize).toString(),
    );
    let key = `rate_limiter:${this.params.generateIdentifier(req)}:${window}`;
    let count: number = (await cache().get(key)) || 0;
    if (!count) {
      await cache().put(
        key,
        1,
        this.params.windowTimeSize * (this.params.windowCount + 1),
      );
      count = 1;
    } else {
      count = await cache().increment(key, 1);
    }

    for (let i = 1; i < this.params.windowCount; i++) {
      count += parseInt(
        (await cache().get(
          `rate_limiter:${this.params.generateIdentifier(req)}:${window - i}`,
        )) || "0",
      );
    }

    if (count > this.params.maxRequests) {
      throw new HttpTooManyRequestsError(
        "Too many requests. Please try again later.",
      );
    }

    await next();
    return;
  }
}

export class DatabaseProviderMiddleware extends Middleware {
  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    const db_configs: Record<string, { provider: string; config: PostgresqlConfig | MysqlConfig | SqliteConfig }> =
      config.get("databases");

    const conns = [];
    try {
      for (const [name, db_config] of Object.entries(db_configs)) {
        const conn = await this.getConnection(db_config);
        ctx().set(["database", name], conn);
        conns.push(conn);
      }
      BaseModel.setConnection(() => {
        const key = ["database", "default"];
        let rc: Connection | undefined;

        if (ctx.isActive()) {
          rc = ctx().get<Connection>(key);
        } else if (Global.has(key)) {
          rc = Global.get<Connection>(key);
        } else {
          rc = this.getConnection(db_configs["default"]);
          Global.set(key, rc);
        }

        return rc!;
      });
      await next();
    } finally {
      for (const conn of conns) {
        await conn.disconnect();
      }
    }
  }

  private static instance: DatabaseProviderMiddleware;

  async register(): Promise<void> {}

  static getInstance(): DatabaseProviderMiddleware {
    if (!DatabaseProviderMiddleware.instance) {
      DatabaseProviderMiddleware.instance = new DatabaseProviderMiddleware();
    }
    return DatabaseProviderMiddleware.instance;
  }

  getConnection(db_config: {
    provider: string;
    config: PostgresqlConfig | MysqlConfig | SqliteConfig;
  }): Connection {
    if (db_config.provider === "postgresql") {
      const conn = new PostgresqlConnection(db_config.config as PostgresqlConfig);
      return conn;
    }

    if (db_config.provider === "sqlite") {
      const conn = new SqliteConnection(db_config.config as SqliteConfig);
      return conn;
    }

    if(db_config.provider === "mysql") {
      const conn = new MysqlConnection(db_config.config as MysqlConfig);
      return conn;
    }

    throw new Error(`Unsupported database provider: ${db_config.provider}`);
  }
}
