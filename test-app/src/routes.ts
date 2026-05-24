import { router as routerFunc } from "@devbro/pashmak/facades";
import { HelloController } from "./app/controllers/HelloController";
import { loggerMiddleware } from "./middlewares";

const router = routerFunc();

router.addGlobalMiddleware(loggerMiddleware);
router
  .addRoute(["GET", "HEAD"], "/", async (req: any, res: any) => {
    return { message: "Welcome to Pashmak!" };
  })
  .addMiddleware([]);

router.addController(HelloController);
