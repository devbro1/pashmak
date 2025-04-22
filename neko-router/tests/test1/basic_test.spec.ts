import { describe, expect, test } from '@jest/globals';
import { Router } from '../../src';
import { Request, Response } from '../../src/types';
describe('Router tests', () => {
  test('basic testing', async () => {
    const router: Router = new Router();

    router.addRoute(['GET', 'HEAD'], '/api/v1/countries', async (req: Request, res: Response) => {
      return 'GET countries';
    });

    router.addRoute(['POST'], '/api/v1/countries', async (req: Request, res: Response) => {
      return 'POST countries';
    });

    router.addRoute(
      ['GET'],
      '/api/v1/countries/:countryId',
      async (req: Request, res: Response) => {
        return 'GET PARAM countries ' + req.params?.countryId;
      }
    );

    let resolved = router.resolve({ uri: '/api/v1/countries', method: 'GET' } as Request);
    expect(resolved).not.toBe(undefined);
    // @ts-ignore
    expect(resolved.params).toEqual({});
    // @ts-ignore
    expect(await resolved.handler({}, {})).toBe('GET countries');

    resolved = router.resolve({ uri: '/api/v1/countries/ABC', method: 'HEAD' } as Request);
    expect(resolved).toBeUndefined();

    resolved = router.resolve({ uri: '/api/v1/countries/ABC', method: 'GET' } as Request);
    // @ts-ignore
    expect(await resolved.handler({ params: resolved?.params }, {})).toBe(
      'GET PARAM countries ABC'
    );

    resolved = router.resolve({ uri: '/api/v1/jobs', method: 'GET' } as Request);
    expect(resolved).toBe(undefined);

    resolved = router.resolve({ uri: '/api/v1/countries/ABC', method: 'DELETE' } as Request);
    expect(resolved).toBeUndefined();

    resolved = router.resolve({ uri: '/api/v1/countries', method: 'HEAD' } as Request);
    expect(resolved).toBeDefined();
  });
});
