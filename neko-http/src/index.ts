import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import { createServer as createServerSecured } from 'https';
import { CompiledRoute, HttpMethod, Route, Router } from '@devbro/neko-router';
import { HttpError, HttpNotFoundError, HttpUnsupportedMediaTypeError } from './errors.mjs';
import { Request } from '@devbro/neko-router';
import { context_provider, ctx } from '@devbro/neko-context';
import formidable from 'formidable';
import qs from 'qs';
// @ts-ignore
import { firstValues } from 'formidable/src/helpers/firstValues.js';
export * from './errors.mjs';

export class HttpServer {
  private https_certs: undefined | { key: string; cert: string } = undefined;

  constructor(
    private options: {
      uploadPath?: string;
      handleOptionsMethod?: boolean;
    } = { uploadPath: '/tmp/uploads', handleOptionsMethod: true }
  ) {}
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
    if (err instanceof HttpError) {
      res.writeHead(err.statusCode, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: err.message,
          code: err.code,
        })
      );
      return;
    }

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
      req.query = qs.parse(req.url?.split('?')[1] || '', {
        ignoreQueryPrefix: true,
        depth: 10,
        interpretNumericEntities: true,
      }) as Record<string, any>;

      req.raw_body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (
          req.headers['content-type']?.includes('multipart/form-data') ||
          req.headers['content-type']?.includes('application/x-www-form-urlencoded') ||
          req.headers['content-type']?.includes('application/json')
        ) {
          const form = formidable({
            multiples: true,
            uploadDir: this.options.uploadPath,
            keepExtensions: true,
          });

          let [fields, files] = await form.parse(req);
          req.body = firstValues(form, fields);
          req.files = firstValues(form, files);

          resolve(req);
          return;
        } else {
          let body = '';

          req.on('data', (chunk: any) => {
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

  async handleOptionsRequest(
    req: Request,
    res: ServerResponse
  ): Promise<CompiledRoute | undefined> {
    if (this.options.handleOptionsMethod === false) {
      return undefined;
    }

    //get all routes regardless of method
    const routes = this.router?.resolveMultiple(req);

    if (routes?.length === 0 || routes === undefined) {
      return;
    }

    let methods: HttpMethod[] = [];
    for (const route of routes || []) {
      methods = methods.concat(route.methods);
    }

    //remove duplicates
    methods = Array.from(new Set(methods));

    let r: Route = new Route(
      ['OPTIONS'],
      req.url || '/',
      async (req: Request, res: ServerResponse) => {
        res.statusCode = 204; // No Content
        res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
        return;
      }
    );

    let cr = new CompiledRoute(r, req, res, this.router?.getMiddlewares() || []);

    return cr;
  }

  async handle(req: IncomingMessage, res: ServerResponse) {
    try {
      await context_provider.run(async () => {
        try {
          req = await this.preprocessRequest(req as Request);
          ctx().set('request', req);
          ctx().set('response', res);
          ctx().set('requestId', this.generateRequestId(req, res));

          let compiled_route = this.router?.getCompiledRoute(req as Request, res);

          if (req.method === 'OPTIONS' && compiled_route === undefined) {
            compiled_route = await this.handleOptionsRequest(req as Request, res);
          }

          if (compiled_route === undefined) {
            throw new HttpNotFoundError(`Route ${req.method} ${req.url} not found`);
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
