import './initialize'

import { cli } from "./facades";

const [node, app, ...args] = process.argv;
cli()
  .runExit(args)
  .then(() => {})
  .catch((err) => {
    console.log(err);
  });
