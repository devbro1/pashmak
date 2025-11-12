import { Stream } from 'stream';
import { Middleware } from './Middleware.mjs';
import { MiddlewareFactory } from './MiddlewareFactory.mjs';
import { Route } from './Route.mjs';
import { HandlerType, MiddlewareProvider } from './types.mjs';
import { Request, Response } from './types.mjs';

export class CompiledRoute {
  constructor(
    public route: Route,
    public request: Request,
    public response: Response,
    public globalMiddlewares: MiddlewareProvider[] = []
  ) {
    this.prepareMiddlewares();
  }

  private middlewares: Middleware[] = [];

  getMiddlewares() {
    return this.middlewares;
  }

  private prepareMiddlewares() {
    this.middlewares = [];
    for (const middleware of [...this.globalMiddlewares, ...this.route.getMiddlewares()]) {
      if (middleware instanceof Middleware) {
        this.middlewares.push(middleware);
      } else if (this.isClass(middleware)) {
        this.middlewares.push((middleware as any).getInstance({}));
      } else if (typeof middleware === 'function') {
        this.middlewares.push(MiddlewareFactory.create(middleware as HandlerType));
      } else {
        throw new Error('Invalid middleware type');
      }
    }
  }

  isClass(func: any) {
    return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
  }

  async run() {
    let rc = await this.runMiddlewares(this.middlewares, this.request, this.response);
    this.response.end();
    return rc;
  }

  prepareOutputJsonFormat<T>(obj: object | Array<any>): T {
    function traverse(value: any): any {
      if (value === undefined || value === null) {
        return null;
      }

      if (!value || typeof value !== 'object') {
        return value;
      }

      if (typeof value.toJson === 'function') {
        return traverse(value.toJson());
      }

      // to handle Date and other built-in types
      if (typeof value.toJSON === 'function') {
        return traverse(value.toJSON());
      }

      if (Array.isArray(value)) {
        return value.map(traverse);
      }

      const result: Record<string, any> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = traverse(value[key]);
        }
      }
      return result;
    }

    return traverse(obj);
  }

  convertToString(obj: any) {
    if (typeof obj === 'string') {
      return obj;
    } else if (obj instanceof Buffer) {
      return obj.toString();
    } else if (typeof obj === 'object') {
      return JSON.stringify(this.prepareOutputJsonFormat(obj));
    }
    return String(obj);
  }

  async processResponseBody(res: Response, controller_rc: any) {
    if (controller_rc && res.writableEnded) {
      throw new Error('cannot write to response, response has already ended');
    }

    if (res.writableEnded) {
      return;
    }

    if (controller_rc) {
      const header_content_type = res.getHeader('Content-Type');
      if (controller_rc instanceof Stream || Buffer.isBuffer(controller_rc)) {
        await this.writeAsync(res, controller_rc);
      } else if (!header_content_type && typeof controller_rc === 'object') {
        res.setHeader('Content-Type', 'application/json');
        res.write(this.convertToString(controller_rc));
      } else if (!header_content_type) {
        res.setHeader('Content-Type', 'text/plain');
        res.write(this.convertToString(controller_rc));
      } else {
        res.write(this.convertToString(controller_rc));
      }
      return;
    } else {
      res.statusCode = [200].includes(res.statusCode) ? 204 : res.statusCode;
    }
  }

  async writeAsync(res: any, chunk: any) {
    return new Promise((resolve, reject) => {
      const ok = res.write(chunk, (err: any) => {
        if (err) reject(err);
      });
      if (ok) {
        // write went through immediately
        resolve(0);
      } else {
        // wait for 'drain' when buffer is flushed
        res.once('drain', resolve);
      }
    });
  }

  async runMiddlewares(middlewares: Middleware[], req: Request, res: Response) {
    let index = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const me = this;

    async function next() {
      if (index >= middlewares.length) {
        const controller_rc = await me.route.callHanlder(req, res);
        await me.processResponseBody(res, controller_rc);
        return;
      }

      const middleware: Middleware | any = middlewares[index++];

      if (middleware instanceof Middleware) {
        await middleware.call(req, res, next);
      } else if (typeof middleware === 'function') {
        await middleware(req, res, next);
      } else {
        throw new Error('does not know how to run middleware');
      }
    }

    await next();
  }
}
