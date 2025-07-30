import { Request, Response } from "@devbro/neko-router";
import { logger, db } from "./facades";

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
