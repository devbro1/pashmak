import { HttpError } from "@devbro/neko-http";
import { logger } from "./facades.mts";

export * from "@devbro/neko-http";

export async function handleHttpErrors(
  err: Error,
  req: any,
  res: any,
): Promise<void> {
  if (err instanceof HttpError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: err.message, error: err.code }));
    logger().warn({ msg: "HttpError: " + err.message, err });
    return;
  } else {
    logger().error({ msg: "Error: " + err.message, err });
  }
  res.writeHead(500, { "Content-Type": "application/json" });
  res.write(JSON.stringify({ error: "Internal Server Error" }));
}
