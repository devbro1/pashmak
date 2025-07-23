import { describe, expect, test } from '@jest/globals';
import { HttpServer } from '../../src';
import supertest from 'supertest';
import { Router } from '@devbro/neko-router';
import { Request, Response } from '@devbro/neko-router';

describe('general http server', () => {
  test('basic testing', async () => {
    const router = new Router();
    router.addRoute(['GET'], '/', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    router.addRoute(['GET'], '/22', (req: Request, res: Response) => {
      return 'Hello World!2';
    });

    const server = new HttpServer();
    server.setRouter(router);

    const s = supertest(server.getHttpHanlder());

    let r = await s.get('/');
    expect(r.status).toBe(200);
    expect(r.text).toBe('Hello World!');

    r = await s.get('/22');
    expect(r.status).toBe(200);
    expect(r.text).toBe('Hello World!2');
  });

  test('handle OPTIONS request', async () => {
    const router = new Router();
    router.addRoute(['GET'], '/route1', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    router.addRoute(['POST'], '/route1', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    router.addRoute(['DELETE'], '/route1', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    router.addRoute(['PATCH'], '/route2', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    const server = new HttpServer();
    server.setRouter(router);

    const s = supertest(server.getHttpHanlder());

    let r = await s.options('/route1');
    expect(r.status).toBe(204);
    expect(r.headers['access-control-allow-methods']).toBe('GET, POST, DELETE');

    r = await s.options('/route2');
    expect(r.status).toBe(204);
    expect(r.headers['access-control-allow-methods']).toBe('PATCH');

    r = await s.options('/route3');
    expect(r.status).toBe(404);
  });
});
