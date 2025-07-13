#!/usr/bin/env node

import "./app/console";
import { logger, cli } from "./facades";

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err: any) => {
    logger().error(err);
  });
