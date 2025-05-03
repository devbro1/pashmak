import { describe, expect, test } from '@jest/globals';
import { Middleware, Router, Route, CompiledRoute } from '../../src';
import { Request, Response } from '../../src/types';

class m1 extends Middleware {
  protected constructor(params: any) {
    super();
  }

  public static getInstance(params: any): Middleware {
    return new m1(params);
  }
  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    // @ts-ignore
    req.parts[1] = 'm1';
    await next();
  }
}

class m2 extends Middleware {
  protected constructor(params: any) {
    super();
  }

  public static getInstance(params: any): Middleware {
    return new m2(params);
  }
  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    // @ts-ignore
    req.parts[1] = 'm2';
    await next();
  }
}

class m3 extends Middleware {
  protected constructor(params: any) {
    super();
  }

  public static getInstance(params: any): Middleware {
    return new m3(params);
  }
  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    // @ts-ignore
    req.parts[1] = 'm3';
    await next();
  }
}

describe('Router tests', () => {
  test('basic testing', async () => {
    const router: Router = new Router();

    router
      .addRoute(['GET', 'HEAD'], '/api/v1/countries', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m1, m2, m3]);

    let req = { url: '/api/v1/countries', method: 'GET' } as Request;
    let resolved: CompiledRoute | undefined = router.getCompiledRoute(req, {} as Response);
    expect(resolved).toBeDefined();

    await resolved?.run();
  });
});
