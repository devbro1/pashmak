import "./initialize";

import { logger, cli } from "@root/facades";

logger().info("start of everything");

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err) => {
    logger().info(err);
  });
