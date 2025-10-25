import { Middleware, Request, Response } from "@devbro/neko-router";
import { logger, db, cache } from "./facades.mjs";
import { HttpTooManyRequestsError } from "@devbro/neko-http";

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
  } finally {
    await db().rollback();
  }
}

export type RateLimiterMiddlewareParams = {
  generateIdentifier: (req: Request) => string;
  maxRequests: number;
  windowTimeSize: number;
  windowCount: number;
};

export class RateLimiterMiddleware extends Middleware {
  static getInstance(
    params: Partial<RateLimiterMiddlewareParams> = {},
  ): Middleware {
    let default_params = {
      generateIdentifier: (req: Request) =>
        req.socket.remoteAddress || "unknown",
      maxRequests: 200,
      windowTimeSize: 30,
      windowCount: 4,
    };
    params = { ...default_params, ...params };
    return new RateLimiterMiddleware(params);
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

    for (let i = 1; i <= this.params.windowCount; i++) {
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
