import { Middleware } from './Middleware';
import { HandlerType, LexerToken, Request, Response } from './types';
import { MiddlewareFactory } from './MiddlewareFactory';
import { BaseController } from './Controller';
import path from 'path';
export * from './Middleware';
export * from './MiddlewareFactory';

export type MiddlewareProvider =
  | typeof Middleware
  | Middleware
  | ((request: Request, response: Response, next: () => Promise<void>) => Promise<void>);

export class Route {
  private middlewares: MiddlewareProvider[] = [];
  private urlRegex: RegExp;
  constructor(
    public methods: string[],
    public path: string,
    public handler: HandlerType
  ) {
    this.urlRegex = this.pathToRegex(path);
  }
  pathToRegex(path: string): RegExp {
    const lex = this.lexUrlPath(path);
    return this.tokensToRegex(lex);
  }

  lexUrlPath(path: string) {
    const tokens = [];
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === '/') {
        tokens.push({ type: 'SLASH', value: '/' });
        i++;
      } else if (char === ':') {
        let start = i + 1;
        while (start < path.length && /[a-zA-Z0-9_]/.test(path[start])) {
          start++;
        }
        tokens.push({ type: 'PARAM', value: path.slice(i + 1, start) });
        i = start;
      } else if (char === '*') {
        let start = i + 1;
        while (start < path.length && /[a-zA-Z0-9_]/.test(path[start])) {
          start++;
        }
        tokens.push({ type: 'WILDCARD', value: path.slice(i + 1, start) });
        i = start;
      } else {
        let start = i;
        while (start < path.length && !['/', ':', '*'].includes(path[start])) {
          start++;
        }
        tokens.push({ type: 'TEXT', value: path.slice(i, start) });
        i = start;
      }
    }

    return tokens;
  }
  tokensToRegex(tokens: LexerToken[]) {
    const regexParts = [];

    for (const token of tokens) {
      if (token.type === 'SLASH') {
        regexParts.push('\\/');
      } else if (token.type === 'PARAM') {
        regexParts.push(`(?<${token.value}>[^\\/]+)`);
      } else if (token.type === 'WILDCARD') {
        regexParts.push('(.+)');
      } else if (token.type === 'TEXT') {
        regexParts.push(token.value.replace(/[-\/\\^$.*+?()[\]{}|]/g, '\\$&'));
      }
    }

    if (regexParts.length > 0 && regexParts[regexParts.length - 1] === '\\/') {
      regexParts[regexParts.length - 1] = '\\/?';
    } else {
      regexParts.push('\\/?');
    }

    return new RegExp(`^${regexParts.join('')}$`);
  }

  /**
   * to evaludate if request is a match for this route
   * @param request http request
   * @returns return true if route is a match for this request
   */
  test(request: Request) {
    if (this.methods.indexOf(request.method) === -1) {
      return false;
    }
    const url = new URL(request.url || '/', 'http://localhost');

    return this.urlRegex.test(url.pathname);
  }

  /**
   * returns details of the match, otherwise it returns false
   * @param request the request to match
   * @returns object cotaining details of match including matched params
   */
  match(request: Request) {
    if (this.methods.indexOf(request.method) === -1) {
      return false;
    }

    const url = new URL(request.url || '/', 'http://localhost');

    const r = this.urlRegex.exec(url.pathname);
    if (!r) {
      return false;
    }

    return {
      url,
      params: r.groups || {},
    };
  }

  addMiddleware(middlewares: MiddlewareProvider | MiddlewareProvider[]) {
    this.middlewares = this.middlewares.concat(middlewares);
    return this;
  }

  getMiddlewares() {
    return this.middlewares;
  }

  callHanlder(request: Request, response: Response) {
    return this.handler(request, response);
  }
}
export class Router {
  routes: Route[] = [];
  addRoute(methods: string[], path: string, handler: HandlerType) {
    const route: Route = new Route(methods, path, handler);
    this.routes.push(route);
    return route;
  }

  addController(controller: typeof BaseController) {
    const basePath = controller.basePath || '';
    for (const route of controller.routes) {
      const urlPath = path.join(basePath, route.path);
      this.addRoute(route.methods, urlPath, async (req: Request, res: Response) => {
        const controllerInstance = controller.getInstance();
        // TODO: route.handler may have wrong value!
        // @ts-ignore
        return await controllerInstance[route.handler]();
      });
    }
  }

  private middlewares: MiddlewareProvider[] = [];
  addGlobalMiddleware(middlewares: MiddlewareProvider | MiddlewareProvider[]) {
    this.middlewares = this.middlewares.concat(middlewares);
  }

  resolve(request: Request): Route | undefined {
    for (const route of this.routes) {
      if (route.test(request)) {
        return route;
      }
    }
    return undefined;
  }

  getCompiledRoute(request: Request, response: Response) {
    const route = this.resolve(request);
    if (!route) {
      return undefined;
    }
    const match = route.match(request);
    if (!match) {
      return undefined;
    }

    request.query = Object.fromEntries(match.url.searchParams.entries());

    return new CompiledRoute(route, match, request, response, this.middlewares);
  }
}

export class CompiledRoute {
  constructor(
    public route: Route,
    public match: any,
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
    return await this.runMiddlewares(this.middlewares, this.request, this.response);
  }

  convertToString(obj: any) {
    if (typeof obj === 'string') {
      return obj;
    } else if (typeof obj === 'object' && obj !== null && typeof obj.toJson === 'function') {
      return obj.toJson().toString();
    } else if (obj instanceof Buffer) {
      return obj.toString();
    } else if (typeof obj === 'object') {
      return JSON.stringify(obj);
    }
    return String(obj);
  }

  processResponseBody(res: Response, controller_rc: any) {
    if (controller_rc && res.writableEnded) {
      throw new Error('cannot write to response, response has already ended');
    }

    if (controller_rc) {
      const header_content_type = res.getHeader('Content-Type');
      if (!header_content_type && typeof controller_rc === 'object') {
        res.setHeader('Content-Type', 'application/json');
      } else if (!header_content_type) {
        res.setHeader('Content-Type', 'text/plain');
      }

      res.end(this.convertToString(controller_rc));
    }
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
