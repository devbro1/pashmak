import { Request, Response } from 'neko-router/src/types';
import { Middleware } from 'neko-router/src/Middleware';
export function createSingleton<T>(
  func: (...args: any[]) => T
): (label?: string, ...args: any[]) => T {
  const instance: Record<string, T> = {};
  return (label = 'default', ...args: any[]): T => {
    if (!instance[label]) {
      instance[label] = func(label, ...args);
    }
    return instance[label];
  };
}

export async function runNext(
  middlewares: Middleware[],
  req: Request,
  res: Response,
  final: (request: Request, response: Response) => Promise<void>
) {
  let index = 0;

  async function next() {
    if (index >= middlewares.length) {
      return await final(req, res);
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
