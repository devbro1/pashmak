import { CompiledRoute } from './CompiledRoute.mjs';
import { BaseController } from './Controller.mjs';
import { MiddlewareFactory } from './MiddlewareFactory.mjs';
import { Route } from './Route.mjs';
import { HandlerType, HttpMethod, MiddlewareProvider } from './types.mjs';
import { Request, Response } from './types.mjs';
import path from 'path';
import urlJoin from 'url-join';

export class Router {
  private middlewares: MiddlewareProvider[] = [];
  routes: Route[] = [];
  addRoute(methods: HttpMethod[], path: string, handler: HandlerType) {
    const route: Route = new Route(methods, path, handler);
    this.routes.push(route);
    return route;
  }

  getMiddlewares() {
    return [...this.middlewares];
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

  addRouter(path: string, router: Router) {
    for (const route of router.routes) {
      let path2 = urlJoin('/', path, route.path);
      this.addRoute(route.methods, path2, route.handler)
        .addMiddleware(router.getMiddlewares())
        .addMiddleware(route.getMiddlewares());
    }
  }

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

  resolveMultiple(request: Request): Route[] {
    const rc: Route[] = [];
    const url = new URL(request.url || '/', 'http://localhost');
    for (const route of this.routes) {
      if (route.testPath(url.pathname)) {
        rc.push(route);
      }
    }
    return rc;
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

    request.params = match.params;
    return new CompiledRoute(route, request, response, this.middlewares);
  }
}
