import { IncomingMessage, RequestListener, ServerResponse, createServer } from 'http';
import { createServer as createServerSecured } from 'https';
import { Route, Router } from 'neko-router/src';
import { NotFound } from 'http-errors';
import { Request } from 'neko-router/src/types';
import { ContextProvider } from './Context';

let cp = new ContextProvider();

export function ctx() {
  return cp.getStore();
}

export class HttpServer {
  private https_certs: undefined | { key: string; cert: string } = undefined;
  constructor() {}
  private requestId: number = 1;

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

  setErrorHandler(
    handler: (err: Error, req: IncomingMessage, res: ServerResponse) => Promise<void>
  ) {
    this.errorHandler = handler;
  }

  generateRequestId(request: IncomingMessage, response: ServerResponse): number | string {
    return this.requestId++;
  }
  setRequestIdGenerator(func: (request: Request, response: ServerResponse) => number | string) {
    this.generateRequestId = func;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    try {
      await cp.run(async () => {
        ctx().set('request', req);
        ctx().set('response', res);
        ctx().set('requestId', this.generateRequestId(req, res));
        const r: Route | undefined = this.router?.resolve(req as any);
        if (r === undefined) {
          throw new NotFound(`Route ${req.url} not found`);
        }

        const compiled_route = this.router?.getCompiledRoute(req as Request, res);
        if (compiled_route === undefined) {
          throw new NotFound();
        }
        await compiled_route?.run();
      });
    } catch (e: any) {
      await this.errorHandler(e, req, res);
    }
    return;
  }

  enableHttps(options: { key: string; cert: string }) {
    this.https_certs = options;
  }

  async listen(port: number, callback: () => void) {
    let server;

    if (this.https_certs) {
      server = createServerSecured(this.https_certs, this.getHttpHanlder());
    } else {
      server = createServer(this.getHttpHanlder());
    }
    return server.listen(port, callback);
  }
}
