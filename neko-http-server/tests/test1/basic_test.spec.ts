import { describe, expect, test } from '@jest/globals';
import { HttpServer } from '../../src';
import supertest from 'supertest';
import { Router } from 'neko-router/src/index';
import { App } from 'supertest/types';
import { IncomingMessage, RequestListener, ServerResponse } from 'http';
import { Server } from 'net';
import express from 'express';

describe('general http server', () => {
  test('basic testing', async () => {
    const router = new Router();
    router.addRoute(['GET'], '/', (req: any, res: any) => {
      res.status(200);
      res.send('Hello World!');
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
