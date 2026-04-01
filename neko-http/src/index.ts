import { IncomingMessage, ServerResponse, createServer } from 'node:http';
import { createServer as createServerSecured } from 'node:https';
import {
  createServer as createHttp2Server,
  createSecureServer as createHttp2SecureServer,
} from 'node:http2';
import { Readable } from 'node:stream';
import { CompiledRoute, HttpMethod, Route, Router } from '@devbro/neko-router';
import {
  BunConfigurationError,
  BunNotAvailableError,
  HttpError,
  HttpNotFoundError,
  HttpUnsupportedMediaTypeError,
} from './errors.mjs';
import { Request } from '@devbro/neko-router';
import { context_provider, ctx } from '@devbro/neko-context';
import formidable from 'formidable';
import qs from 'qs';
// @ts-ignore
import { firstValues } from 'formidable/src/helpers/firstValues.js';
export * from './errors.mjs';

const isBunRuntime = (): boolean => typeof (globalThis as Record<string, unknown>).Bun !== 'undefined';

export class HttpServer {
  private https_certs: undefined | { key: string; cert: string } = undefined;

  constructor(
    private options: {
      uploadPath?: string;
      handleOptionsMethod?: boolean;
      useHttp2?: boolean;
      preferBun?: boolean;
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
    } finally {
      // make sure connection is closed no matter what, otherwise response is never sent.
      res.end();
    }
    return;
  }

  enableHttps(options: { key: string; cert: string }) {
    this.https_certs = options;
  }

  private async bunHandler(bunReq: globalThis.Request): Promise<globalThis.Response> {
    const bodyBuffer = bunReq.body ? Buffer.from(await bunReq.arrayBuffer()) : Buffer.alloc(0);

    const readable = new Readable({
      read() {
        this.push(bodyBuffer);
        this.push(null);
      },
    });

    const url = new URL(bunReq.url);

    const req = Object.assign(readable, {
      method: bunReq.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(bunReq.headers.entries()),
      httpVersion: '1.1',
      httpVersionMajor: 1,
      httpVersionMinor: 1,
    }) as unknown as IncomingMessage;

    const responseState = {
      statusCode: 200,
      headers: {} as Record<string, string | string[]>,
      body: [] as Buffer[],
      ended: false,
    };

    const res = {
      get statusCode() {
        return responseState.statusCode;
      },
      set statusCode(code: number) {
        responseState.statusCode = code;
      },
      get writableEnded() {
        return responseState.ended;
      },
      get finished() {
        return responseState.ended;
      },
      headersSent: false,
      setHeader(name: string, value: string | string[]) {
        responseState.headers[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return responseState.headers[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete responseState.headers[name.toLowerCase()];
      },
      writeHead(code: number, hdrs?: Record<string, string | string[]>) {
        responseState.statusCode = code;
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) {
            responseState.headers[k.toLowerCase()] = v;
          }
        }
        return this;
      },
      write(chunk: unknown) {
        if (chunk) {
          responseState.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
        }
        return true;
      },
      end(chunk?: unknown) {
        if (chunk) {
          responseState.body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
        }
        responseState.ended = true;
      },
      on() {
        return this;
      },
      once() {
        return this;
      },
      emit() {
        return false;
      },
    } as unknown as ServerResponse;

    await this.handle(req, res);

    const responseHeaders = new Headers();
    for (const [key, value] of Object.entries(responseState.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          responseHeaders.append(key, v);
        }
      } else {
        responseHeaders.set(key, value);
      }
    }

    return new Response(responseState.body.length > 0 ? Buffer.concat(responseState.body) : null, {
      status: responseState.statusCode,
      headers: responseHeaders,
    });
  }

  async listen(port: number, callback: () => void) {
    if (this.options.preferBun) {
      if (!isBunRuntime()) {
        throw new BunNotAvailableError();
      }
      if (this.options.useHttp2) {
        throw new BunConfigurationError(
          'useHttp2 is not compatible with preferBun. Bun.serve handles HTTP/2 automatically when TLS is configured.'
        );
      }

      const me = this;
      const bunGlobal = globalThis as unknown as { Bun: { serve: (opts: Record<string, unknown>) => unknown } };
      return bunGlobal.Bun.serve({
        port,
        tls: this.https_certs
          ? { key: this.https_certs.key, cert: this.https_certs.cert }
          : undefined,
        async fetch(req: globalThis.Request) {
          return me.bunHandler(req);
        },
      });
    }

    let server;

    if (this.options.useHttp2) {
      if (this.https_certs) {
        server = createHttp2SecureServer(
          this.https_certs,
          this.getHttpHanlder() as unknown as Parameters<typeof createHttp2SecureServer>[1]
        );
      } else {
        server = createHttp2Server(
          this.getHttpHanlder() as unknown as Parameters<typeof createHttp2Server>[0]
        );
      }
    } else if (this.https_certs) {
      server = createServerSecured(this.https_certs, this.getHttpHanlder());
    } else {
      server = createServer(this.getHttpHanlder());
    }

    return server.listen(port, callback);
  }
}
