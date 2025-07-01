import "@devbro/pashmak/src/initialize";

import { logger, cli } from "@devbro/pashmak/src/facades";

logger().info("start of everything");

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err) => {
    logger().error(err);
  });
