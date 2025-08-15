import { describe, expect, test } from 'vitest';
import { Middleware, Router } from '../src';
import { Request, Response } from '../src/types.mjs';
import { BaseController, Get, Post, Controller, createParamDecorator } from '../src';

function ValidatedRequestBody(): ParameterDecorator {
  return createParamDecorator(async () => {
    throw new Error('This is a placeholder for ValidatedRequestBody decorator');
    // return { message: 'Validated request body' };
  });
}

function QuickData(val: any): ParameterDecorator {
  return createParamDecorator(async () => {
    return val;
  });
}

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

@Controller('/api/v1/provinces')
class ProvinceController extends BaseController {
  @Get()
  show() {
    return 'GET provinces';
  }

  @Get({ path: '/capital' })
  getCapitalProvince() {
    return 'GET provinces by capital';
  }

  @Post({ path: '/capital' })
  postCapitalProvince() {
    return 'GET provinces by capital';
  }
}

@Controller('/api/v1/cities')
class CityController extends BaseController {
  @Get()
  show() {
    return 'GET cities';
  }

  @Post()
  create(@ValidatedRequestBody() body: Request) {
    return body;
  }

  @Get({ path: '/:id' })
  showById() {
    return 'GET cities by id';
  }
}

describe('multiple Controller Class', () => {
  test('two controllers should not share routes', async () => {
    const router: Router = new Router();

    expect(CountryController.routes.length).toBe(2);
    expect(ProvinceController.routes.length).toBe(3);

    router.addController(CountryController);
    router.addController(ProvinceController);

    let req = { url: '/api/v1/countries/ABC', method: 'GET' } as Request;
    let resolved = router.resolve(req)!;
    expect(await resolved.handler({ ...resolved.match(req) } as Request, {} as Response)).toBe(
      'GET countries by id'
    );

    req = { url: '/api/v1/provinces/capital', method: 'GET' } as Request;
    resolved = router.resolve(req)!;

    expect(await resolved.handler({ ...resolved.match(req) } as Request, {} as Response)).toBe(
      'GET provinces by capital'
    );

    req = { url: '/api/v1/provinces/capital2', method: 'GET' } as Request;
    let resolved2 = router.resolve(req);
    expect(resolved2).toBeUndefined();
  });

  test('controller should not share param decorators', async () => {
    const router: Router = new Router();
    expect(CityController.routes.length).toBe(3);
    router.addController(CityController);

    let req = { url: '/api/v1/cities/123', method: 'GET' } as Request;
    let resolved = router.resolve(req)!;

    expect(await resolved.handler({ ...resolved.match(req) } as Request, {} as Response)).toBe(
      'GET cities by id'
    );

    req = { url: '/api/v1/cities', method: 'POST' } as Request;
    try {
      resolved = router.resolve(req)!;
    } catch (e: any) {
      expect(e.message).toBe('This is a placeholder for ValidatedRequestBody decorator');
    }
  });
});
