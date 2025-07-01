import { ctx } from "neko-helper";
import { Request, Response } from "@devbro/pashmak/router";
import { Unauthorized } from "http-errors";
import { decodeJwtToken } from "@root/helpers";
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

export async function logResponseMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  await next();
  logger().info({ msg: "response:", statusCode: res.statusCode });
}

export async function authenticate(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  let auth_header = req.headers.authorization;
  if (!auth_header) {
    throw new Unauthorized("missing authorization header");
  }

  // Expect header format: "Bearer <token>"
  const parts = auth_header.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new Unauthorized('expected "authorization: Bearer TOKEN"');
  }
  try {
    let user = await decodeJwtToken(parts[1]);
    ctx().set("auth_user", user);
  } catch (ex: any) {
    let err = new Unauthorized("invalid jwt token");
    err.cause = ex;
    throw err;
  }

  await next();
}
