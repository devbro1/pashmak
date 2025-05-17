import { Request, Response } from "neko-router/src/types";
import { router } from "./router";

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/part2",
  async (req: Request, res: Response) => {
    return { yey: "GET part2" };
  },
);
