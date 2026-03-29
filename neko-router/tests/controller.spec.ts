import { describe, expect, test } from 'vitest';
import { Middleware, Router } from '../src';
import { Request, Response } from '../src/types.mjs';
import { BaseController, Get, Controller } from '../src/Controller.mjs';

@Controller('/api/v1/countries')
class CountryController extends BaseController {
  @Get()
  show() {
    return 'GET countries';
  }

  @Get({ path: '/:id' })
  showById() {
    return 'GET countries by id';
  }
}

describe('Controller Class', () => {
  test('basic testing', async () => {
    const router: Router = new Router();

    router.addController(CountryController);

    expect(router.resolve({ url: '/api/v1/countries', method: 'GET' } as Request)).toBeDefined();
    expect(router.resolve({ url: '/api/v1/countries/', method: 'GET' } as Request)).toBeDefined();

    expect(
      router.resolve({ url: '/api/v1/countries/fakeId', method: 'GET' } as Request)
    ).toBeDefined();
    expect(
      router.resolve({ url: '/api/v1/countries/fakeId/', method: 'GET' } as Request)
    ).toBeDefined();

    let req = { url: '/api/v1/countries', method: 'GET' } as Request;
    let resolved = router.resolve(req);
    // @ts-ignore
    expect(await resolved.handler({ ...resolved.match(req) }, {})).toBe('GET countries');

    req = { url: '/api/v1/countries/ABC', method: 'GET' } as Request;
    resolved = router.resolve(req);
    // @ts-ignore
    expect(await resolved.handler({ ...resolved.match(req) }, {})).toBe('GET countries by id');
  });
});
