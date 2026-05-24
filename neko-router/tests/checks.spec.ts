import { describe, expect, test } from 'vitest';
import { Router } from '../src';
import type { Request, Response } from '../src/types.mjs';

describe('addCheck tests', () => {
  test('route-level check: selects route based on accept-version header', async () => {
    const router = new Router();

    router
      .addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
        return 'v1 users';
      })
      .addCheck((req) => req.headers?.['accept-version'] === '1');

    router
      .addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
        return 'v2 users';
      })
      .addCheck((req) => req.headers?.['accept-version'] === '2');

    const reqV1 = {
      url: '/api/users',
      method: 'GET',
      headers: { 'accept-version': '1' },
    } as Request;
    const resV1 = {} as Response;
    const compiledV1 = router.getCompiledRoute(reqV1, resV1);
    expect(compiledV1).toBeDefined();
    await expect(compiledV1!.route.handler(reqV1, resV1)).resolves.toBe('v1 users');

    const reqV2 = {
      url: '/api/users',
      method: 'GET',
      headers: { 'accept-version': '2' },
    } as Request;
    const resV2 = {} as Response;
    const compiledV2 = router.getCompiledRoute(reqV2, resV2);
    expect(compiledV2).toBeDefined();
    await expect(compiledV2!.route.handler(reqV2, resV2)).resolves.toBe('v2 users');
  });

  test('route-level check: returns undefined when no check passes', () => {
    const router = new Router();

    router
      .addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
        return 'v1 users';
      })
      .addCheck((req) => req.headers?.['accept-version'] === '1');

    const req = { url: '/api/users', method: 'GET', headers: { 'accept-version': '3' } } as Request;
    const res = {} as Response;
    const compiled = router.getCompiledRoute(req, res);
    expect(compiled).toBeUndefined();
  });

  test('router-level check: blocks all routes when check fails', () => {
    const router = new Router();

    router.addCheck((req) => req.headers?.['accept-version'] === '1');

    router.addRoute(['GET'], '/api/v1/users', async (req: Request, res: Response) => {
      return 'v1 users';
    });

    router.addRoute(['GET'], '/api/v1/orders', async (req: Request, res: Response) => {
      return 'v1 orders';
    });

    // v1 requests should work
    const reqV1 = {
      url: '/api/v1/users',
      method: 'GET',
      headers: { 'accept-version': '1' },
    } as Request;
    const compiledV1 = router.getCompiledRoute(reqV1, {} as Response);
    expect(compiledV1).toBeDefined();

    // v2 requests should be blocked (router-level check fails)
    const reqV2 = {
      url: '/api/v1/users',
      method: 'GET',
      headers: { 'accept-version': '2' },
    } as Request;
    const compiledV2 = router.getCompiledRoute(reqV2, {} as Response);
    expect(compiledV2).toBeUndefined();

    const reqV2Orders = {
      url: '/api/v1/orders',
      method: 'GET',
      headers: { 'accept-version': '2' },
    } as Request;
    const compiledV2Orders = router.getCompiledRoute(reqV2Orders, {} as Response);
    expect(compiledV2Orders).toBeUndefined();
  });

  test('nested router: sub-router check only applies to sub-router routes', () => {
    const parentRouter = new Router();

    // Parent router's own route (no check)
    parentRouter.addRoute(['GET'], '/api/home', async (req: Request, res: Response) => {
      return 'home';
    });

    // Sub-router with a version check
    const subRouter = new Router();
    subRouter.addCheck((req) => req.headers?.['accept-version'] === '2');
    subRouter.addRoute(['GET'], '/api/users', async (req: Request, res: Response) => {
      return 'v2 users';
    });

    parentRouter.addRouter('', subRouter);

    // Request without accept-version: sub-router routes should not be selected, parent route should still work
    const reqNoVersion = { url: '/api/home', method: 'GET', headers: {} } as Request;
    const compiledHome = parentRouter.getCompiledRoute(reqNoVersion, {} as Response);
    expect(compiledHome).toBeDefined();

    // Sub-router route without proper header should be blocked
    const reqNoVersionUsers = { url: '/api/users', method: 'GET', headers: {} } as Request;
    const compiledUsersNoVersion = parentRouter.getCompiledRoute(reqNoVersionUsers, {} as Response);
    expect(compiledUsersNoVersion).toBeUndefined();

    // Sub-router route with correct header should work
    const reqV2Users = {
      url: '/api/users',
      method: 'GET',
      headers: { 'accept-version': '2' },
    } as Request;
    const compiledUsersV2 = parentRouter.getCompiledRoute(reqV2Users, {} as Response);
    expect(compiledUsersV2).toBeDefined();
  });

  test('nested router: deeply nested checks accumulate correctly', () => {
    const parentRouter = new Router();
    const subRouter = new Router();

    // Sub-router check: accept-version must be '2'
    subRouter.addCheck((req) => req.headers?.['accept-version'] === '2');

    // Route-level check: x-feature header must be 'enabled'
    subRouter
      .addRoute(['GET'], '/api/feature', async (req: Request, res: Response) => {
        return 'feature';
      })
      .addCheck((req) => req.headers?.['x-feature'] === 'enabled');

    parentRouter.addRouter('', subRouter);

    // Both checks pass
    const reqBoth = {
      url: '/api/feature',
      method: 'GET',
      headers: { 'accept-version': '2', 'x-feature': 'enabled' },
    } as Request;
    expect(parentRouter.getCompiledRoute(reqBoth, {} as Response)).toBeDefined();

    // Only router check passes (route check fails)
    const reqOnlyRouter = {
      url: '/api/feature',
      method: 'GET',
      headers: { 'accept-version': '2' },
    } as Request;
    expect(parentRouter.getCompiledRoute(reqOnlyRouter, {} as Response)).toBeUndefined();

    // Only route check passes (router check fails)
    const reqOnlyRoute = {
      url: '/api/feature',
      method: 'GET',
      headers: { 'x-feature': 'enabled' },
    } as Request;
    expect(parentRouter.getCompiledRoute(reqOnlyRoute, {} as Response)).toBeUndefined();

    // Neither check passes
    const reqNone = { url: '/api/feature', method: 'GET', headers: {} } as Request;
    expect(parentRouter.getCompiledRoute(reqNone, {} as Response)).toBeUndefined();
  });
});
