import { Request, Response } from "neko-router/src/types";
import { router as routerFunc, db as dbf } from "./facades";
import { sleep } from "neko-helper";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { ctx } from "neko-helper";
import { CatController } from "./app/controllers/CatController";
import { loggerMiddleware, logResponseMiddleware } from "./middlewares";

const router = routerFunc();

router.addGlobalMiddleware(loggerMiddleware);
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

/*
CREATE TABLE cats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
);
*/
router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/time",
  async (req: Request, res: Response) => {
    console.log("GET time", req?.query?.wait, ctx().get("requestId"));

    await sleep(parseInt(req?.query?.wait || "") || 0);
    console.log("waited", req?.query?.wait);

    const db = dbf();
    let error = undefined;
    try {
      await db.beginTransaction();
      await db.runQuery({
        sql: "insert into cats (name) values ($1)",
        bindings: [req?.query?.name as string],
      });
      console.log("inserted", req?.query?.name);
      await db.commit();
      error = "success";
    } catch (err) {
      await db.rollback();
      error = "FAILED";
      res.statusCode = 500;
    }

    console.log("FIN time", req?.query?.wait);
    // @ts-ignore
    const dd = req.context.dd;
    return { yey: "GET time", time: new Date().toISOString(), error, dd };
  },
);

router
  .addRoute(
    ["GET", "HEAD"],
    "/api/v1/part2/:param1",
    async (req: Request, res: Response) => {
      return { yey: "GET part2", param1: req.params.param1 };
    },
  )
  .addMiddleware(logResponseMiddleware);

router.addController(CatController);
