import "./initialize";

import { cli } from "./facades";
import { logger } from "@root/facades";

logger().info("start of everything");

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err) => {
    logger().info(err);
  });
