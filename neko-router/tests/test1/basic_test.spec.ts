import { describe, expect, test } from '@jest/globals';
import { Middleware, Router } from '../../src';
import { Request, Response } from '../../src/types';

class m1 extends Middleware {
  protected constructor(params: any) {
    super();
  }

  public static getInstance(params: any): Middleware {
    return new m1(params);
  }
  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

class m2 extends Middleware {
  protected constructor(params: any = {}) {
    super(params);
  }

  private static instance: m2 | undefined = undefined;
  public static getInstance(params: any = {}): Middleware {
    return (m2.instance = m2.instance || new m2(params));
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}
describe('Router tests', () => {
  test('basic testing', async () => {
    const router: Router = new Router();

    router.addRoute(['GET', 'HEAD'], '/api/v1/countries', async (req: Request, res: Response) => {
      return 'GET countries';
    });

    router
      .addRoute(['POST'], '/api/v1/countries', async (req: Request, res: Response) => {
        return 'POST countries';
      })
      .addMiddleware([m1, m2]);

    router.addRoute(
      ['GET'],
      '/api/v1/countries/:countryId',
      async (req: Request, res: Response) => {
        return 'GET PARAM countries ' + req.params?.countryId;
      }
    );

    let req = { uri: '/api/v1/countries', method: 'GET' } as Request;
    let resolved = router.resolve(req);
    expect(resolved).toBeDefined();
    // @ts-ignore
    expect(resolved?.match(req)).toEqual({ params: {} });
    // @ts-ignore
    expect(await resolved.handler({}, {})).toBe('GET countries');

    resolved = router.resolve({ uri: '/api/v1/countries/ABC', method: 'HEAD' } as Request);
    expect(resolved).toBeUndefined();

    req = { uri: '/api/v1/countries/ABC', method: 'GET' } as Request;
    resolved = router.resolve(req);
    // @ts-ignore
    expect(await resolved.handler({ ...resolved.match(req) }, {})).toBe('GET PARAM countries ABC');

    resolved = router.resolve({ uri: '/api/v1/jobs', method: 'GET' } as Request);
    expect(resolved).toBe(undefined);

    resolved = router.resolve({ uri: '/api/v1/countries/ABC', method: 'DELETE' } as Request);
    expect(resolved).toBeUndefined();

    resolved = router.resolve({ uri: '/api/v1/countries', method: 'HEAD' } as Request);
    expect(resolved).toBeDefined();

    resolved = router.resolve({ uri: '/api/v1/countries', method: 'POST' } as Request);
    expect(resolved).toBeDefined();
    expect(resolved?.getMiddlewares().length).toBe(2);
  });
});
