import { Router } from "neko-router/src";
import { HttpServer } from "neko-http/src";
import { Request, Response } from "neko-router/src/types";
import { HttpError } from "http-errors";
import { wait } from "neko-helper/src/time";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";

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

// load database connection
router.addGlobalMiddleware(
  async (req: Request, res: Response, next: () => Promise<void>) => {
    const db = DatabaseServiceProvider.getInstance();
    const conn = await db.getConnection();
    req.context.db = conn;
    await next();
    await conn.disconnect();
  },
);

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

function InjectedValue(value: any) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    return 1;
  };
}

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/time",
  async (req: Request, res: Response) => {
    // @ts-ignore
    //await req.context.db.query("insert into meow (name) values (?)",[req.query.name]);
    const aa = InjectedValue(22)(null, "aa", 1);
    console.log(aa);
    await wait(parseInt(req?.query?.wait || "") || 0);
    console.log("waited", req?.query?.wait);
    return { yey: "GET time", time: new Date().toISOString(), aa };
  },
);

server.setRouter(router);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
