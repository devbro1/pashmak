import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { GenerateApiDocsCommand } from "../src/app/console/generate/GenerateApiDocsCommand.mjs";
import { router } from "../src/facades.mjs";
import * as fs from "fs/promises";
import path from "path";
import { Cli } from "clipanion";

describe("GenerateApiDocsCommand", () => {
  const testPublicDir = "/tmp/test-public";

  beforeEach(async () => {
    // Clean up before each test
    await fs.rm(testPublicDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    // Clean up after each test
    await fs.rm(testPublicDir, { recursive: true, force: true });
  });

  test("should generate openapi.json file", async () => {
    // Add some test routes
    router().addRoute(["GET"], "/test-route", async () => {
      return { test: true };
    });

    router().addRoute(["POST"], "/test-route/:id", async () => {
      return { test: true };
    });

    // Create CLI and run command
    const cli = new Cli();
    cli.register(GenerateApiDocsCommand);

    // Change to temp directory
    const originalCwd = process.cwd();
    process.chdir("/tmp");

    try {
      // Run the command
      await cli.run(["generate", "apidocs"]);

      // Check if file was created
      const outputPath = path.join("/tmp", "public", "openapi.json");
      const fileExists = await fs
        .access(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Read and parse the file
      const content = await fs.readFile(outputPath, "utf-8");
      const spec = JSON.parse(content);

      // Verify OpenAPI structure
      expect(spec.openapi).toBe("3.0.0");
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe("API Documentation");
      expect(spec.paths).toBeDefined();
      expect(typeof spec.paths).toBe("object");
    } finally {
      // Restore original working directory
      process.chdir(originalCwd);
    }
  });

  test("should convert route parameters to OpenAPI format", async () => {
    // Add route with parameters
    router().addRoute(["GET"], "/api/:userId/posts/:postId", async () => {
      return {};
    });

    const cli = new Cli();
    cli.register(GenerateApiDocsCommand);

    const originalCwd = process.cwd();
    process.chdir("/tmp");

    try {
      await cli.run(["generate", "apidocs"]);

      const content = await fs.readFile(
        path.join("/tmp", "public", "openapi.json"),
        "utf-8",
      );
      const spec = JSON.parse(content);

      // Check if path was converted correctly
      expect(spec.paths["/api/{userId}/posts/{postId}"]).toBeDefined();

      // Check if parameters were extracted
      const params =
        spec.paths["/api/{userId}/posts/{postId}"].get?.parameters || [];
      expect(params.length).toBeGreaterThan(0);
      expect(params.some((p: any) => p.name === "userId")).toBe(true);
      expect(params.some((p: any) => p.name === "postId")).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test("should add request body for POST, PUT, PATCH methods", async () => {
    router().addRoute(["POST"], "/api/items", async () => {
      return {};
    });

    const cli = new Cli();
    cli.register(GenerateApiDocsCommand);

    const originalCwd = process.cwd();
    process.chdir("/tmp");

    try {
      await cli.run(["make", "apidocs"]);

      const content = await fs.readFile(
        path.join("/tmp", "public", "openapi.json"),
        "utf-8",
      );
      const spec = JSON.parse(content);

      expect(spec.paths["/api/items"].post.requestBody).toBeDefined();
      expect(spec.paths["/api/items"].post.requestBody.required).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });
});
