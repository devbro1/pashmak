import { describe, expect, test } from '@jest/globals';
import { Middleware, Router } from '../src';
import { Request, Response } from '../src/types';
import { BaseController, GET, Controller } from '../src/Controller';

@Controller('/api/v1/countries')
class CountryController extends BaseController {
  @GET()
  show() {
    return 'GET countries';
  }

  @GET('/:id')
  showById() {
    return 'GET countries by id';
  }
}

console.log('CountryController', CountryController);

describe('Controller Class', () => {
  test('basic testing', async () => {
    const router: Router = new Router();

    router.addController(CountryController);

    console.log('router.routes', router.routes);

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
