import dotenv from "dotenv";
dotenv.config();

process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
import config from "config";

import { HttpServer } from "neko-http/src";
import { HttpError } from "http-errors";
import { router, scheduler } from "./facades";

import "./routes";
import "./schedules";

let server = new HttpServer();

server.setErrorHandler(async (err: Error, req: any, res: any) => {
  if (err instanceof HttpError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: err.message }));
    console.log("HttpError:", err.message);
    return;
  } else {
    console.error("non HttpError:", err);
  }
  res.writeHead(500, { "Content-Type": "" });
  res.end(JSON.stringify({ error: "Internal Server Error" }));
});

scheduler().start();
server.setRouter(router());

server.listen(config.get("port"), () => {
  console.log("Server is running on http://localhost:" + config.get("port"));
});
