import { IncomingMessage, RequestListener, ServerResponse, createServer } from 'http';
import { Route, Router } from 'neko-router/src';
import { NotFound } from 'http-errors';
import { Request } from 'neko-router/src/types';

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

  private async errorHandler(err: Error, req: IncomingMessage, res: ServerResponse): Promise<void> {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }

  setErrorHandler(handler: (err: Error, req: IncomingMessage, res: ServerResponse) => Promise<void>) {
    this.errorHandler = handler;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    
    try {
      const r: Route | undefined = this.router?.resolve(req as any);
      if (r === undefined) {
        throw new NotFound();
      }

      let compiled_route = this.router?.getCompiledRoute(req as Request,res);
      await compiled_route?.run();
    } catch (e: any) {
      await this.errorHandler(e, req, res);
    }
    return;
  }

  async listen(port: number, callback: () => void) {
    const server = createServer(this.getHttpHanlder());
    return server.listen(port, callback);
  }
}
