import { describe, expect, test } from '@jest/globals';
import { Middleware, Router, Route, CompiledRoute } from '../../src';
import { Request, Response } from '../../src/types';
import { createMockResponse } from './mocks';
class m1 extends Middleware {
  protected constructor(params: any) {
    super();
  }

  public static getInstance(params: any): Middleware {
    return new m1(params);
  }
  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    // @ts-ignore
    req.parts.m1 = 'm1';
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
    req.parts.m2 = 'm2';
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
    req.parts.m3 = 'm3';
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

    // @ts-ignore
    const req = { url: '/api/v1/countries', method: 'GET', parts: {} } as Request & { parts: any };
    const res = createMockResponse();
    const resolved: CompiledRoute | undefined = router.getCompiledRoute(req, res);
    expect(resolved).toBeDefined();
    await resolved?.run();
    expect(req.parts).toEqual({ m1: 'm1', m2: 'm2', m3: 'm3' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('GET countries');
  });

  test('error handling', async () => {
    const router: Router = new Router();

    router
      .addRoute(['GET', 'HEAD'], '/api/v1/countries', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m1, m2, m3])
      .addMiddleware(async (req: Request, res: Response, next: Function) => {
        throw new Error('Error in middleware');
      });

    const req = { url: '/api/v1/countries', method: 'GET', parts: {} } as Request & { parts: any };
    const res = createMockResponse();
    const resolved: CompiledRoute | undefined = router.getCompiledRoute(req, res);
    expect(resolved).toBeDefined();
    try {
      await resolved?.run();
    } catch (e) {
      expect(e).toEqual(new Error('Error in middleware'));
    }
  });
});
