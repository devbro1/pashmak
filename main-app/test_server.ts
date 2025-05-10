import { Router } from "neko-router/src";
import { HttpServer } from "neko-http-server/src";
import { HttpError } from "http-errors";

let server = new HttpServer();

// server.setErrorHandler((err: Error, req: any, res: any) => {
//     if(err instanceof HttpError) {
//         res.writeHead(err.statusCode, { 'Content-Type': 'application/json' });
//         res.end(JSON.stringify({ message: err.message}));
//         return;
//       }
//     res.writeHead(500, { 'Content-Type': '' });
//     res.end(JSON.stringify({ error: 'Internal Server Error' }));
// });

let router = new Router();
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

server.setRouter(router);

server.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
