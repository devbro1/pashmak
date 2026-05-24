import path from 'path';
import urlJoin from 'url-join';
import { CompiledRoute } from './CompiledRoute.mjs';
import type { BaseController } from './Controller.mjs';
import { MiddlewareFactory } from './MiddlewareFactory.mjs';
import { Route } from './Route.mjs';
import type {
  HandlerType,
  HttpMethod,
  MiddlewareProvider,
  Request,
  Response,
  RouteCheck,
} from './types.mjs';

export class Router {
  private middlewares: MiddlewareProvider[] = [];
  private checks: RouteCheck[] = [];
  routes: Route[] = [];
  addRoute(methods: HttpMethod[], path: string, handler: HandlerType) {
    const route: Route = new Route(methods, path, handler);
    this.routes.push(route);
    return route;
  }

  getMiddlewares() {
    return [...this.middlewares];
  }

  addCheck(checks: RouteCheck | RouteCheck[]) {
    this.checks = this.checks.concat(checks);
    return this;
  }

  getChecks() {
    return [...this.checks];
  }

  addController(controller: typeof BaseController) {
    const basePath = controller.basePath || '';
    for (const route of controller.routes) {
      const urlPath = path.join(basePath, route.path);
      this.addRoute(route.methods, urlPath, async (req: Request, res: Response) => {
        const controllerInstance = controller.getInstance();
        // @ts-expect-error
        return await controllerInstance[route.handler]();
      }).addMiddleware([...controller.baseMiddlewares, ...route.middlewares]);
    }
  }

  addRouter(path: string, router: Router) {
    for (const route of router.routes) {
      const path2 = urlJoin('/', path, route.path);
      this.addRoute(route.methods, path2, route.handler)
        .addMiddleware(router.getMiddlewares())
        .addMiddleware(route.getMiddlewares())
        .addCheck(router.getChecks())
        .addCheck(route.getChecks());
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
    for (const check of this.checks) {
      if (!check(request, response)) {
        return undefined;
      }
    }

    for (const route of this.routes) {
      if (!route.test(request)) {
        continue;
      }
      const match = route.match(request);
      if (!match) {
        continue;
      }

      let allChecksPass = true;
      for (const check of route.getChecks()) {
        if (!check(request, response)) {
          allChecksPass = false;
          break;
        }
      }
      if (!allChecksPass) {
        continue;
      }

      request.params = match.params;
      return new CompiledRoute(route, request, response, this.middlewares);
    }

    return undefined;
  }
}
