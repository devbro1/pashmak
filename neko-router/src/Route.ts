import { Middleware } from './Middleware';
import { MiddlewareFactory } from './MiddlewareFactory';
import { HandlerType, MiddlewareProvider } from './types';
import { LexerToken, Request, Response } from './types';

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
