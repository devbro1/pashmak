import { LexerToken, Request, Response } from './types';

export abstract class Middleware {
  protected constructor(params: any = {}) {}
  static getInstance(params: any): Middleware {
    throw new Error('Method not implemented. Please implement a static getInstance method.');
  }

  abstract call(req: Request, res: Response, next: () => Promise<void>): Promise<void>;
}

export class Route {
  private middlewares: (typeof Middleware | (() => Middleware))[] = [];
  private uriRegex: RegExp;
  constructor(
    public methods: string[],
    public path: string,
    public handler: Function
  ) {
    this.uriRegex = this.pathToRegex(path);
  }
  pathToRegex(path: string): RegExp {
    const lex = this.lexUriPath(path);
    return this.tokensToRegex(lex);
  }

  lexUriPath(path: string) {
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

  test(request: Request) {
    if (this.methods.indexOf(request.method) === -1) {
      return false;
    }

    return this.uriRegex.test(request.uri);
  }

  match(request: Request) {
    if (this.methods.indexOf(request.method) === -1) {
      return false;
    }

    let r = this.uriRegex.exec(request.uri);
    if (!r) {
      return false;
    }

    return {
      // @ts-ignore
      params: r.groups || {},
    };
  }

  addMiddleware(
    middlewares:
      | typeof Middleware
      | (typeof Middleware)[]
      | (() => Middleware)
      | (() => Middleware)[]
  ) {
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
    return route;
  }

  resolve(request: Request): Route | undefined {
    for (const route of this.routes) {
      let r = route.match(request);
      if (route.test(request)) {
        return route;
      }
    }
    return undefined;
  }
}
