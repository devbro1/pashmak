import { Request, Response } from "@devbro/pashmak/router";
import { router as routerFunc, db as dbf } from "@devbro/pashmak/facades";
import { sleep } from "@devbro/pashmak/helper";
import { CatController } from "./app/controllers/CatController";
import { AnimalController } from "./app/controllers/AnimalController";
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
    await sleep(parseInt(req?.query?.wait || "") || 0);

    const db = dbf();
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

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/test",
  async (req: Request, res: Response) => {
    console.log(router.routes);
    return {};
  },
);

router.addController(CatController);
router.addController(AnimalController);
await import("./app/controllers/AuthController");
