import { Router } from "neko-router/src";
import { HttpServer } from "neko-http/src";
import { Request, Response } from "neko-router/src/types";
import { HttpError } from "http-errors";

let server = new HttpServer();

server.setErrorHandler(async (err: Error, _req: any, res: any) => {
  console.error("Error:", err);
  if (err instanceof HttpError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: err.message }));
    return;
  }
  res.writeHead(500, { "Content-Type": "" });
  res.end(JSON.stringify({ error: "Internal Server Error" }));
});

let router = new Router();

router.addGlobalMiddleware(
  async (req: Request, res: Response, next: () => Promise<void>) => {
    console.log("route:", req.url);
    await next();
  },
);
router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/countries",
  async (req: any, res: any) => {
    return { yey: "GET countries" };
  },
);

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/regions",
  async (req: any, res: any) => {
    return { yey: "GET regions" };
  },
);

router.addRoute(["GET", "HEAD"], "/api/v1/time", async (req: any, res: any) => {
  return { yey: "GET time", time: new Date().toISOString() };
});

server.setRouter(router);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
