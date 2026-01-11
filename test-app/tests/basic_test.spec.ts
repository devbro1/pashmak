import "@/initialize";

import { describe, expect, test } from "vitest";
import supertest from "supertest";
import { httpServer } from "@devbro/pashmak/facades";

describe("basic tests", () => {
  test("basic testing", async () => {
    const server = httpServer();

    const s = supertest(server.getHttpHanlder());

    let r = await s.get("/api/v1/animals");
  });
});
