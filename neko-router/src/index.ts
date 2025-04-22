import { LexerToken, Request, Response } from './types';
export class Route {
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
      handler: this.handler,
    };
  }
}
export class Router {
  routes: Route[] = [];
  addRoute(methods: string[], path: string, handler: Function) {
    this.routes.push(new Route(methods, path, handler));
  }

  resolve(request: Request): { params: any; handler: Function } | undefined {
    for (const route of this.routes) {
      let r = route.match(request);
      if (r) {
        return { ...r, handler: route.handler };
      }
    }
    return undefined;
  }
}
