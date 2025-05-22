import { ctx } from "neko-http/src";
import { Request, Response } from "neko-router/src/types";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  console.log("route:", req.url);
  console.log("context", ctx().keys());
  await next();
}

export async function logResponseMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  await next();
  console.log("response:", res.statusCode);
}
