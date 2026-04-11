import "@/initialize";

import { describe, expect, test } from "vitest";
import supertest from "supertest";
import { httpServer } from "@devbro/pashmak/facades";

describe("basic tests", () => {
  test("funcational controller", async () => {
    const server = httpServer();

    const s = supertest(server.getHttpHanlder());

    let r = await s.get("/api/v1/meow");
    expect(r.status).toBe(200);
    expect(r.text).toContain("meow meow!");
  });

  test("class controller", async () => {
    const server = httpServer();

    const s = supertest(server.getHttpHanlder());

    let r = await s.get("/api/v1/hello");
    expect(r.status).toBe(200);
    expect(r.text).toContain("Hello world!");
  });
});
