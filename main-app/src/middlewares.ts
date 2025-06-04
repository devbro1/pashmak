import { ctx } from "neko-helper/src";
import { Request, Response } from "neko-router/src/types";
import { Unauthorized } from "http-errors";
import { decodeJwtToken } from "@root/helpers";

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: () => Promise<void>,
): Promise<void> {
  // console.log("route:", req.url);
  // console.log("context", ctx().keys());
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
  let user = await decodeJwtToken(parts[1]);
  ctx().set("auth_user", user);

  await next();
}
