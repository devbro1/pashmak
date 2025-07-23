import { ctx } from "@devbro/pashmak/context";
import { Request, Response } from "@devbro/pashmak/router";
import { logger } from "@devbro/pashmak/facades";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  logger().info({
    msg: "available context",
    keys: ctx().keys(),
    route: req.url,
  });
  await next();
}
