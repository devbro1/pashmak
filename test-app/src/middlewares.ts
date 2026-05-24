import { ctx } from "@devbro/pashmak/context";
import { logger } from "@devbro/pashmak/facades";
import type { Request, Response } from "@devbro/pashmak/router";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  logger().info({
    msg: "Incoming Http Request",
    keys: ctx().keys(),
    route: req.url,
  });
  await next();
}
