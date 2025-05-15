import { Router } from "neko-router/src";
import { HttpServer } from "neko-http/src";
import { Request, Response } from "neko-router/src/types";
import { HttpError } from "http-errors";
import { wait } from "neko-helper/src/time";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { ctx } from "neko-http/src";
import { Connection } from "neko-sql/src/Connection";
import { BaseModel } from "neko-orm/src/baseModel";

let server = new HttpServer();

server.setErrorHandler(async (err: Error, req: any, res: any) => {
  if (err instanceof HttpError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: err.message }));
    console.log("HttpError:", err.message);
    return;
  } else {
    console.error("non HttpError:", err);
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
    ctx().get<Request>("request").context.dd = "cc";
    try {
      ctx().set("db", conn);
      BaseModel.setConnection(() => ctx().getOrThrow<Connection>("db"));
      await next();
    } catch (err) {
      throw err;
    } finally {
      await conn.disconnect();
    }
  },
);

router.addGlobalMiddleware(
  async (req: Request, res: Response, next: () => Promise<void>) => {
    console.log("route:", req.url);
    console.log("context", ctx().keys());
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

/*
CREATE TABLE cats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE
);
*/
router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/time",
  async (req: Request, res: Response) => {
    console.log("GET time", req?.query?.wait, ctx().get("requestId"));

    await wait(parseInt(req?.query?.wait || "") || 0);
    console.log("waited", req?.query?.wait);

    let db = ctx().getOrThrow<Connection>("db");
    let error = undefined;
    try {
      await db.beginTransaction();
      await db.runQuery({
        sql: "insert into cats (name) values ($1)",
        bindings: [req?.query?.name as string],
      });
      await db.commit();
      error = "success";
    } catch (err) {
      await db.rollback();
      error = "FAILED";
      res.statusCode = 500;
    }

    console.log("FIN time", req?.query?.wait);
    let dd = req.context.dd;
    return { yey: "GET time", time: new Date().toISOString(), error, dd };
  },
);

server.setRouter(router);

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
