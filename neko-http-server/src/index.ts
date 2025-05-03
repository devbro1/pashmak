import { IncomingMessage, RequestListener, ServerResponse } from 'http';
import { Route, Router } from 'neko-router/src';

export class HttpServer {
  constructor() {}

  private router: Router | undefined;
  setRouter(router: Router) {
    this.router = router;
  }

  getRouter() {
    return this.router;
  }

  getHttpHanlder() {
    let me = this;
    return (req: IncomingMessage, res: ServerResponse) => {
      return me.handle(req, res);
    };
  }

  handle(req: IncomingMessage, res: ServerResponse) {
    let r: Route | undefined = this.router?.resolve(req as any);
    if (r === undefined) {
      res.statusCode = 404;
      res.write('Not Found');
      res.end();
      return;
    }

    res.statusCode = 200;
    res.write('Hello World!');
    res.end();
  }
}
