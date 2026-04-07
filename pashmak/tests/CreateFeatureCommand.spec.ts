import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { CreateFeatureCommand } from "../src/app/console/generate/CreateFeatureCommand.mjs";
import * as fs from "fs/promises";
import path from "path";
import { Cli } from "clipanion";

describe("CreateFeatureCommand", () => {
  const testDir = "/tmp/test-create-feature";

  beforeEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, "src", "app", "features"), {
      recursive: true,
    });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  const runCommand = async (args: string[]) => {
    const cli = new Cli();
    cli.register(CreateFeatureCommand);
    const originalCwd = process.cwd();
    process.chdir(testDir);
    try {
      await cli.run(args);
    } finally {
      process.chdir(originalCwd);
    }
  };

  test("should create feature with all files when --all flag is given", async () => {
    await runCommand(["create", "feature", "--all", "BlogPost"]);

    const featureDir = path.join(
      testDir,
      "src",
      "app",
      "features",
      "blogPost",
    );

    const files = await fs.readdir(featureDir);
    expect(files).toContain("index.ts");
    expect(files).toContain("BlogPostController.ts");
    expect(files).toContain("BlogPostService.ts");
    expect(files).toContain("BlogPostRepository.ts");
    expect(files).toContain("BlogPostModel.ts");
    expect(files).toContain("BlogPostQueryScopes.ts");
    expect(files).toContain("BlogPostValidations.ts");
    expect(files).toContain("BlogPostQueue.ts");
    expect(files).toContain("BlogPostCron.ts");
  });

  test("should create only selected files based on flags", async () => {
    await runCommand([
      "create",
      "feature",
      "--controller",
      "--service",
      "Product",
    ]);

    const featureDir = path.join(
      testDir,
      "src",
      "app",
      "features",
      "product",
    );

    const files = await fs.readdir(featureDir);
    expect(files).toContain("index.ts");
    expect(files).toContain("ProductController.ts");
    expect(files).toContain("ProductService.ts");
    expect(files).not.toContain("ProductRepository.ts");
    expect(files).not.toContain("ProductModel.ts");
    expect(files).not.toContain("ProductQueue.ts");
    expect(files).not.toContain("ProductCron.ts");
  });

  test("should use make feature alias", async () => {
    await runCommand(["make", "feature", "--controller", "Order"]);

    const featureDir = path.join(testDir, "src", "app", "features", "order");
    const files = await fs.readdir(featureDir);
    expect(files).toContain("index.ts");
    expect(files).toContain("OrderController.ts");
  });

  test("should use pascal case for class names", async () => {
    await runCommand(["create", "feature", "--model", "user_profile"]);

    const featureDir = path.join(
      testDir,
      "src",
      "app",
      "features",
      "userProfile",
    );

    const files = await fs.readdir(featureDir);
    expect(files).toContain("UserProfileModel.ts");

    const modelContent = await fs.readFile(
      path.join(featureDir, "UserProfileModel.ts"),
      "utf-8",
    );
    expect(modelContent).toContain("class UserProfileModel");
    expect(modelContent).toContain('tableName = "user_profiles"');
  });

  test("controller template should include correct route name", async () => {
    await runCommand(["create", "feature", "--controller", "BlogPost"]);

    const featureDir = path.join(
      testDir,
      "src",
      "app",
      "features",
      "blogPost",
    );
    const controllerContent = await fs.readFile(
      path.join(featureDir, "BlogPostController.ts"),
      "utf-8",
    );
    expect(controllerContent).toContain("BlogPostController");
    expect(controllerContent).toContain("/api/v1/blog-posts");
  });

  test("index.ts should export only created parts", async () => {
    await runCommand([
      "create",
      "feature",
      "--controller",
      "--model",
      "Invoice",
    ]);

    const featureDir = path.join(
      testDir,
      "src",
      "app",
      "features",
      "invoice",
    );
    const indexContent = await fs.readFile(
      path.join(featureDir, "index.ts"),
      "utf-8",
    );
    expect(indexContent).toContain("InvoiceController");
    expect(indexContent).toContain("InvoiceModel");
    expect(indexContent).not.toContain("InvoiceService");
    expect(indexContent).not.toContain("InvoiceQueue");
  });

  test("should update routes.ts when controller is created", async () => {
    // Create a minimal routes.ts
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "routes.ts"),
      `import { router as routerFunc } from "@devbro/pashmak/facades";\n\nconst router = routerFunc();\n`,
    );

    await runCommand(["create", "feature", "--controller", "Payment"]);

    const routesContent = await fs.readFile(
      path.join(testDir, "src", "routes.ts"),
      "utf-8",
    );
    expect(routesContent).toContain("PaymentController");
    expect(routesContent).toContain(
      `import { PaymentController } from "./app/features/payment/PaymentController"`,
    );
    expect(routesContent).toContain("router.addController(PaymentController)");
  });

  test("should update src/app/models/index.ts when model is created", async () => {
    await fs.mkdir(path.join(testDir, "src", "app", "models"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(testDir, "src", "app", "models", "index.ts"),
      "// export all models from here\n",
    );

    await runCommand(["create", "feature", "--model", "Category"]);

    const modelsIndexContent = await fs.readFile(
      path.join(testDir, "src", "app", "models", "index.ts"),
      "utf-8",
    );
    expect(modelsIndexContent).toContain("CategoryModel");
    expect(modelsIndexContent).toContain(
      `export * from "../features/category/CategoryModel"`,
    );
  });

  test("should update src/app/queues/index.ts when queue is created", async () => {
    await fs.mkdir(path.join(testDir, "src", "app", "queues"), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(testDir, "src", "app", "queues", "index.ts"),
      `import { queue } from '@devbro/pashmak/facades';\n\nexport function registerQueueListeners() {\n  let rc: any = {};\n  return rc;\n}\n`,
    );

    await runCommand(["create", "feature", "--queue", "Notification"]);

    const queuesContent = await fs.readFile(
      path.join(testDir, "src", "app", "queues", "index.ts"),
      "utf-8",
    );
    expect(queuesContent).toContain("NotificationQueue");
    expect(queuesContent).toContain(
      `import { NotificationQueue } from "../features/notification/NotificationQueue"`,
    );
    expect(queuesContent).toContain("NotificationQueue.listen()");
  });

  test("should update src/schedules.ts when cron is created", async () => {
    await fs.mkdir(path.join(testDir, "src"), { recursive: true });
    await fs.writeFile(
      path.join(testDir, "src", "schedules.ts"),
      `import { scheduler } from "@devbro/pashmak/facades";\n`,
    );

    await runCommand(["create", "feature", "--cron", "Report"]);

    const schedulesContent = await fs.readFile(
      path.join(testDir, "src", "schedules.ts"),
      "utf-8",
    );
    expect(schedulesContent).toContain("ReportCron");
    expect(schedulesContent).toContain(
      `import "./app/features/report/ReportCron"`,
    );
  });

  test("should not fail if routes.ts does not exist", async () => {
    // Don't create routes.ts - should not throw
    await expect(
      runCommand(["create", "feature", "--controller", "Ghost"]),
    ).resolves.not.toThrow();
  });
});
