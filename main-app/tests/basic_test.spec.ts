import "@root/initialize";

import { describe, expect, test } from "@jest/globals";
import supertest from 'supertest';
import { Request, Response } from 'neko-router/src/types';
import { httpServer } from "@root/facades";



describe("basic tests", () => {
  test("basic testing", async () => {

    const server = httpServer();

    const s = supertest(server.getHttpHanlder());

    let r = await s.get('/api/v1/animals');
    expect(r.status).toBe(200);
    expect(r.text).toContain('data');
  });
});
