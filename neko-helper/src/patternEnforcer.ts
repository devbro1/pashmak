import { Request, Response, Middleware } from '@devbro/neko-router';

/**
 * create a singleton using the function provided.
 * @param func - a function that will be called to create the instance.
 * @returns A function that return a singleton instance of the type T for a given label.
 */
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
