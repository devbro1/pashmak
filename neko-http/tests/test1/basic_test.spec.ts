import { describe, expect, test } from '@jest/globals';
import { HttpServer } from '../../src';
import supertest from 'supertest';
import { Router } from 'neko-router/src/index';
import { Request, Response } from 'neko-router/src/types';

describe('general http server', () => {
  test('basic testing', async () => {
    const router = new Router();
    router.addRoute(['GET'], '/', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Hello World!');
      res.end();
    });

    const server = new HttpServer();
    server.setRouter(router);

    const s = supertest(server.getHttpHanlder());

    let r = await s.get('/');
    expect(r.status).toBe(200);
    expect(r.text).toBe('Hello World!');
  });
});
