import { LexerToken, Request, Response } from './types';

export type MiddlewareProvider =
  | typeof Middleware
  | Middleware
  | ((request: Request, response: Response, next: () => Promise<void>) => Promise<void>);

export abstract class Middleware {
  protected constructor(params: any = {}) {}
  static getInstance(params: any): Middleware {
    throw new Error('Method not implemented. Please implement a static getInstance method.');
  }

  abstract call(req: Request, res: Response, next: () => Promise<void>): Promise<void>;
}

export class Route {
  private middlewares: MiddlewareProvider[] = [];
  private urlRegex: RegExp;
  constructor(
    public methods: string[],
    public path: string,
    public handler: Function
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

    return this.urlRegex.test(request.url);
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

    const r = this.urlRegex.exec(request.url);
    if (!r) {
      return false;
    }

    return {
      // @ts-ignore
      params: r.groups || {},
    };
  }

  addMiddleware(middlewares: MiddlewareProvider | MiddlewareProvider[]) {
    this.middlewares = this.middlewares.concat(middlewares);
  }

  getMiddlewares() {
    return this.middlewares;
  }
}
export class Router {
  routes: Route[] = [];
  addRoute(methods: string[], path: string, handler: Function) {
    const route: Route = new Route(methods, path, handler);
    this.routes.push(route);
    route.addMiddleware(this.middlewares);
    return route;
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

    return new CompiledRoute(route, match, request, response);
  }
}

export class CompiledRoute {
  constructor(
    public route: Route,
    public match: any,
    public request: Request,
    public response: Response
  ) {
    this.prepareMiddlewares();
  }

  private middlewares: Middleware[] = [];

  private prepareMiddlewares() {
    this.middlewares = [];
    for (const middleware of this.route.getMiddlewares()) {
      if (middleware instanceof Middleware) {
        this.middlewares.push(middleware);
      } else if (this.isClass(middleware)) {
        this.middlewares.push((middleware as any).getInstance({}));
      } else if (typeof middleware === 'function') {
        let middlewareFunc = {} as Middleware;
        // @ts-ignore
        middlewareFunc.call = middleware;
        this.middlewares.push(middlewareFunc);
      } else {
        throw new Error('Invalid middleware type');
      }
    }
  }

  isClass(func: any) {
    return typeof func === 'function' && /^class\s/.test(Function.prototype.toString.call(func));
  }

  async run() {
    return await this.runMiddlewares(
      this.middlewares,
      this.request,
      this.response,
      async (request: any, response: any) => {
        console.log('done', request?.parts);
      }
    );
  }

  async runMiddlewares(
    middlewares: Middleware[],
    req: Request,
    res: Response,
    finalHandler: Function
  ) {
    let index = 0;

    async function next() {
      if (index >= middlewares.length) return;

      const middleware: Middleware | any = middlewares[index++];

      if (middleware instanceof Middleware) {
        await middleware.call(req, res, next);
      } else if (typeof middleware === 'function') {
        await middleware(req, res, next);
      }
    }

    try {
      await next();
    } catch (err) {
      console.error('Error in middleware:', err);
      finalHandler(err);
    }
  }
}
