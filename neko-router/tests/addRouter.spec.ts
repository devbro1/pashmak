import { describe, expect, test } from 'vitest';
import { Middleware, Router } from '../src';
import { Request, Response } from '../src/types.mjs';

class m1 extends Middleware {
  public static getInstance(params: any): Middleware {
    return new m1(params);
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

class m2 extends Middleware {
  public static getInstance(params: any): Middleware {
    return new m2(params);
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

class m3 extends Middleware {
  public static getInstance(params: any): Middleware {
    return new m3(params);
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

class m4 extends Middleware {
  public static getInstance(params: any): Middleware {
    return new m4(params);
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

class m5 extends Middleware {
  public static getInstance(params: any): Middleware {
    return new m5(params);
  }

  async call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
    await next();
  }
}

describe('Router tests', () => {
  test('with defined path', async () => {
    const router: Router = new Router();
    router.addGlobalMiddleware(m1);

    router.addRoute(['GET', 'HEAD'], '/api/v1/router1', async (req: Request, res: Response) => {
      return 'root1';
    });

    const router2: Router = new Router();
    router2.addGlobalMiddleware(m2);
    router2.addGlobalMiddleware(m3);

    router2
      .addRoute(['GET'], '/api/v1/countries', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m4, m5]);

    router2
      .addRoute(['GET'], '/api/v1/onemid', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m5]);

    router2
      .addRoute(['GET'], '/api/v1/repeat3mid', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m4, m4, m4]);

    router.addRouter('/m1/', router2);

    expect(router.routes.length).toBe(4);

    let cr1 = router.getCompiledRoute(
      { url: '/api/v1/router1', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr1?.getMiddlewares().length).toBe(1);

    let cr = router.getCompiledRoute(
      { url: '/m1/api/v1/repeat3mid', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr?.getMiddlewares().length).toBe(6);

    let cr2 = router.getCompiledRoute(
      { url: '/m1/api/v1/countries', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr2?.getMiddlewares().length).toBe(5);

    let cr3 = router.getCompiledRoute(
      { url: '/m1/api/v1/onemid', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr3?.getMiddlewares().length).toBe(4);
  });

  test('no prefix path', async () => {
    const router: Router = new Router();
    router.addGlobalMiddleware(m1);

    router.addRoute(['GET', 'HEAD'], '/api/v1/router1', async (req: Request, res: Response) => {
      return 'root1';
    });

    const router2: Router = new Router();
    router2.addGlobalMiddleware(m2);
    router2.addGlobalMiddleware(m3);

    router2
      .addRoute(['GET'], '/api/v1/countries', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m4, m5]);

    router2
      .addRoute(['GET'], '/api/v1/onemid', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m5]);

    router2
      .addRoute(['GET'], '/api/v1/repeat3mid', async (req: Request, res: Response) => {
        return 'GET countries';
      })
      .addMiddleware([m4, m4, m4]);

    router.addRouter('', router2);

    expect(router.routes.length).toBe(4);

    let cr1 = router.getCompiledRoute(
      { url: '/api/v1/router1', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr1?.getMiddlewares().length).toBe(1);

    let cr = router.getCompiledRoute(
      { url: '/api/v1/repeat3mid', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr?.getMiddlewares().length).toBe(6);

    let cr2 = router.getCompiledRoute(
      { url: '/api/v1/countries', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr2?.getMiddlewares().length).toBe(5);

    let cr3 = router.getCompiledRoute(
      { url: '/api/v1/onemid', method: 'GET' } as Request,
      {} as Response
    );
    expect(cr3?.getMiddlewares().length).toBe(4);
  });
});
