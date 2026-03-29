import "./initialize";
import { logger, cli } from "@devbro/pashmak/facades";

logger().info("start of everything");

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err: any) => {
    logger().error(err);
  });
