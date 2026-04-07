import { cli } from "../../../facades.mjs";
import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import handlebars from "handlebars";
import { fileURLToPath } from "url";
import pluralize from "pluralize";
import { input, checkbox } from "@inquirer/prompts";

export class CreateFeatureCommand extends Command {
  static paths = [
    [`create`, `feature`],
    [`make`, `feature`],
  ];

  static usage = Command.Usage({
    category: `Generate`,
    description: `Create a new feature with its related files`,
    details: `
      This command creates a new feature folder under src/app/features/<name>/.
      Use --all to scaffold all related files, or pass individual flags to select specific parts.
      If no feature name or flags are provided, you will be prompted interactively.
    `,
    examples: [
      [`Create a feature with all files`, `create feature --all MyFeature`],
      [
        `Create a feature with only a controller and service`,
        `create feature --controller --service MyFeature`,
      ],
      [
        `Create a feature interactively`,
        `create feature`,
      ],
    ],
  });

  featureName = Option.String({ required: false });

  all = Option.Boolean("--all", {
    description: "Create all feature files",
    required: false,
  });

  withController = Option.Boolean("--controller", {
    description: "Create a controller",
    required: false,
  });

  withService = Option.Boolean("--service", {
    description: "Create a service",
    required: false,
  });

  withRepository = Option.Boolean("--repository", {
    description: "Create a repository",
    required: false,
  });

  withModel = Option.Boolean("--model", {
    description: "Create a model",
    required: false,
  });

  withQueryScopes = Option.Boolean("--query-scopes", {
    description: "Create query scopes",
    required: false,
  });

  withValidations = Option.Boolean("--validations", {
    description: "Create controller validations",
    required: false,
  });

  withQueue = Option.Boolean("--queue", {
    description: "Create a queue handler",
    required: false,
  });

  withCron = Option.Boolean("--cron", {
    description: "Create a cron job",
    required: false,
  });

  async execute() {
    // Resolve feature name interactively if not provided
    if (!this.featureName) {
      this.featureName = await input({
        message: "Enter feature name (e.g. User, BlogPost):",
        validate: (v) => (v.trim().length > 0 ? true : "Feature name is required"),
      });
    }

    const anyFlagGiven =
      this.all ||
      this.withController ||
      this.withService ||
      this.withRepository ||
      this.withModel ||
      this.withQueryScopes ||
      this.withValidations ||
      this.withQueue ||
      this.withCron;

    // If no flags given, ask interactively
    if (!anyFlagGiven) {
      const choices = await checkbox({
        message: "Select the parts to create for this feature:",
        choices: [
          { name: "Controller", value: "controller" },
          { name: "Service", value: "service" },
          { name: "Repository", value: "repository" },
          { name: "Model", value: "model" },
          { name: "Query Scopes", value: "queryScopes" },
          { name: "Validations", value: "validations" },
          { name: "Queue", value: "queue" },
          { name: "Cron", value: "cron" },
        ],
      });

      this.withController = choices.includes("controller");
      this.withService = choices.includes("service");
      this.withRepository = choices.includes("repository");
      this.withModel = choices.includes("model");
      this.withQueryScopes = choices.includes("queryScopes");
      this.withValidations = choices.includes("validations");
      this.withQueue = choices.includes("queue");
      this.withCron = choices.includes("cron");
    } else if (this.all) {
      this.withController = true;
      this.withService = true;
      this.withRepository = true;
      this.withModel = true;
      this.withQueryScopes = true;
      this.withValidations = true;
      this.withQueue = true;
      this.withCron = true;
    }

    const rootDir = process.cwd();
    const className = Case.pascal(this.featureName);
    const classNameLower = Case.camel(this.featureName);
    const routeName = Case.kebab(pluralize(this.featureName));
    const tableName = Case.snake(pluralize(this.featureName));
    const featureDir = path.join(rootDir, "src", "app", "features", classNameLower);

    await fs.mkdir(featureDir, { recursive: true });
    this.context.stdout.write(`Creating feature "${className}" in ${featureDir}\n`);

    let dirname = typeof __dirname === "string" ? __dirname : undefined;
    if (!dirname) {
      dirname = path.dirname(fileURLToPath(import.meta.url));
    }

    const tplData = {
      className,
      classNameLower,
      routeName,
      tableName,
      withController: this.withController,
      withService: this.withService,
      withRepository: this.withRepository,
      withModel: this.withModel,
      withQueryScopes: this.withQueryScopes,
      withValidations: this.withValidations,
      withQueue: this.withQueue,
      withCron: this.withCron,
    };

    handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

    const renderTpl = async (tplName: string, destFile: string) => {
      const tplPath = path.join(dirname as string, `./${tplName}`);
      const raw = (await fs.readFile(tplPath)).toString();
      const compiled = handlebars.compile(raw);
      await fs.writeFile(path.join(featureDir, destFile), compiled(tplData));
      this.context.stdout.write(`  Created ${destFile}\n`);
    };

    // Always create index.ts
    await renderTpl("feature-index.tpl", "index.ts");

    if (this.withController) {
      await renderTpl("feature-controller.tpl", `${className}Controller.ts`);
    }
    if (this.withService) {
      await renderTpl("feature-service.tpl", `${className}Service.ts`);
    }
    if (this.withRepository) {
      await renderTpl("feature-repository.tpl", `${className}Repository.ts`);
    }
    if (this.withModel) {
      await renderTpl("feature-model.tpl", `${className}Model.ts`);
    }
    if (this.withQueryScopes) {
      await renderTpl("feature-query-scopes.tpl", `${className}QueryScopes.ts`);
    }
    if (this.withValidations) {
      await renderTpl("feature-validations.tpl", `${className}Validations.ts`);
    }
    if (this.withQueue) {
      await renderTpl("feature-queue.tpl", `${className}Queue.ts`);
    }
    if (this.withCron) {
      await renderTpl("feature-cron.tpl", `${className}Cron.ts`);
    }

    // Post-creation: update routes.ts if controller was created
    if (this.withController) {
      await this.addControllerToRoutes(rootDir, className, classNameLower);
    }

    // Post-creation: update src/app/models/index.ts if model was created
    if (this.withModel) {
      await this.addModelToIndex(rootDir, className, classNameLower);
    }

    // Post-creation: update queue listeners if queue was created
    if (this.withQueue) {
      await this.addQueueToListeners(rootDir, className, classNameLower);
    }

    // Post-creation: update schedules.ts if cron was created
    if (this.withCron) {
      await this.addCronToSchedules(rootDir, className, classNameLower);
    }

    this.context.stdout.write(`\nFeature "${className}" created successfully!\n`);
  }

  async addControllerToRoutes(
    rootDir: string,
    className: string,
    classNameLower: string,
  ) {
    const routesPath = path.join(rootDir, "src", "routes.ts");
    try {
      let content = await fs.readFile(routesPath, "utf-8");
      const importLine = `import { ${className}Controller } from "./app/features/${classNameLower}/${className}Controller";`;
      const addControllerLine = `router.addController(${className}Controller);`;

      if (content.includes(importLine)) {
        return; // already added
      }

      // Add import at the top (after existing imports)
      const lastImportIndex = content.lastIndexOf("import ");
      const endOfLastImport = content.indexOf("\n", lastImportIndex);
      content =
        content.slice(0, endOfLastImport + 1) +
        importLine +
        "\n" +
        content.slice(endOfLastImport + 1);

      // Append addController call at the end of file
      content = content.trimEnd() + "\n" + addControllerLine + "\n";

      await fs.writeFile(routesPath, content);
      this.context.stdout.write(`  Updated src/routes.ts with ${className}Controller\n`);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        this.context.stdout.write(
          `  Warning: src/routes.ts not found. Please manually add ${className}Controller to your routes.\n`,
        );
      } else {
        throw e;
      }
    }
  }

  async addModelToIndex(rootDir: string, className: string, classNameLower: string) {
    const modelIndexPath = path.join(rootDir, "src", "app", "models", "index.ts");
    const exportLine = `export * from "../features/${classNameLower}/${className}Model";`;
    try {
      let content = await fs.readFile(modelIndexPath, "utf-8");
      if (content.includes(exportLine)) {
        return;
      }
      content = content.trimEnd() + "\n" + exportLine + "\n";
      await fs.writeFile(modelIndexPath, content);
      this.context.stdout.write(
        `  Updated src/app/models/index.ts with ${className}Model\n`,
      );
    } catch (e: any) {
      if (e.code === "ENOENT") {
        this.context.stdout.write(
          `  Warning: src/app/models/index.ts not found. Please manually export ${className}Model.\n`,
        );
      } else {
        throw e;
      }
    }
  }

  async addQueueToListeners(
    rootDir: string,
    className: string,
    classNameLower: string,
  ) {
    const queuesIndexPath = path.join(rootDir, "src", "app", "queues", "index.ts");
    const importLine = `import { ${className}Queue } from "../features/${classNameLower}/${className}Queue";`;
    const listenerLine = `  rc.${classNameLower} = ${className}Queue.listen();`;
    try {
      let content = await fs.readFile(queuesIndexPath, "utf-8");
      if (content.includes(importLine)) {
        return;
      }
      // Add import at the top
      content = importLine + "\n" + content;
      // Insert listener call inside registerQueueListeners before the return statement
      const returnIndex = content.indexOf("  return rc;");
      if (returnIndex !== -1) {
        content =
          content.slice(0, returnIndex) +
          listenerLine +
          "\n" +
          content.slice(returnIndex);
      }
      await fs.writeFile(queuesIndexPath, content);
      this.context.stdout.write(
        `  Updated src/app/queues/index.ts with ${className}Queue\n`,
      );
    } catch (e: any) {
      if (e.code === "ENOENT") {
        this.context.stdout.write(
          `  Warning: src/app/queues/index.ts not found. Please manually register ${className}Queue.\n`,
        );
      } else {
        throw e;
      }
    }
  }

  async addCronToSchedules(
    rootDir: string,
    className: string,
    classNameLower: string,
  ) {
    const schedulesPath = path.join(rootDir, "src", "schedules.ts");
    const importLine = `import "./app/features/${classNameLower}/${className}Cron";`;
    try {
      let content = await fs.readFile(schedulesPath, "utf-8");
      if (content.includes(importLine)) {
        return;
      }
      content = content.trimEnd() + "\n" + importLine + "\n";
      await fs.writeFile(schedulesPath, content);
      this.context.stdout.write(
        `  Updated src/schedules.ts with ${className}Cron\n`,
      );
    } catch (e: any) {
      if (e.code === "ENOENT") {
        this.context.stdout.write(
          `  Warning: src/schedules.ts not found. Please manually import ${className}Cron.\n`,
        );
      } else {
        throw e;
      }
    }
  }

  async catch(error: unknown) {
    if (Error.isError(error)) {
      this.context.stderr.write(`Error: ${error.message}\n`);
    } else {
      this.context.stderr.write(`Error: ${String(error)}\n`);
    }
  }
}

cli().register(CreateFeatureCommand);
