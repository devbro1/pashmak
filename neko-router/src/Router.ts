import { CompiledRoute } from './CompiledRoute';
import { BaseController } from './Controller';
import { Middleware } from './Middleware';
import { MiddlewareFactory } from './MiddlewareFactory';
import { Route } from './Route';
import { HandlerType, MiddlewareProvider } from './types';
import { LexerToken, Request, Response } from './types';
import path from 'path';

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
        // @ts-ignore
        return await controllerInstance[route.handler]();
      }).addMiddleware([...controller.baseMiddlewares, ...route.middlewares]);
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
    request.params = match.params;
    return new CompiledRoute(route, match, request, response, this.middlewares);
  }
}
