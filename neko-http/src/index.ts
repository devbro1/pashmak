import { IncomingMessage, RequestListener, ServerResponse, createServer } from 'http';
import { createServer as createServerSecured } from 'https';
import { Route, Router } from 'neko-router';
import { HttpNotFoundError, HttpUnsupportedMediaTypeError } from './errors';
import { Request } from 'neko-router';
import { context_provider, ctx } from 'neko-helper';
import formidable from 'formidable';
// @ts-ignore
import { firstValues } from 'formidable/src/helpers/firstValues.js';
import {config} from 'neko-config';
export * from './errors';

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
    const me = this;
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

  async preprocessRequest(req: Request): Promise<Request> {
    return new Promise(async (resolve, reject) => {
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (
          req.headers['content-type']?.includes('multipart/form-data') ||
          req.headers['content-type']?.includes('application/x-www-form-urlencoded') ||
          req.headers['content-type']?.includes('application/json')
        ) {
          const form = formidable({
            multiples: true,
            uploadDir: config.get('file_upload_path'),
            keepExtensions: true,
          });

          let [fields, files] = await form.parse(req);
          req.body = firstValues(form, fields);
          req.files = firstValues(form, files);

          resolve(req);
          return;
        } else {
          let body = '';

          req.on('data', (chunk) => {
            body += chunk.toString(); // Convert Buffer to string
          });

          req.on('end', () => {
            if (req.headers['content-type']?.includes('text/plain')) {
              req.body = body;
            } else {
              reject(new HttpUnsupportedMediaTypeError());
            }

            resolve(req);
            return;
          });
        }
      } else {
        resolve(req);
      }
    });
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    try {
      await context_provider.run(async () => {
        try {
          req = await this.preprocessRequest(req as Request);
          ctx().set('request', req);
          ctx().set('response', res);
          ctx().set('requestId', this.generateRequestId(req, res));
          const r: Route | undefined = this.router?.resolve(req as any);
          if (r === undefined) {
            throw new HttpNotFoundError(`Route ${req.url} not found`);
          }

          const compiled_route = this.router?.getCompiledRoute(req as Request, res);
          if (compiled_route === undefined) {
            throw new HttpNotFoundError();
          }
          await compiled_route?.run();
        } catch (err) {
          await this.errorHandler(err as Error, req, res);
        }
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
