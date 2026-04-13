import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import handlebars from "handlebars";
import { execSync } from "child_process";
import { select, Separator, input } from "@inquirer/prompts";

export class CreateProjectCommand extends Command {
  static paths = [[`create`, `project`]];

  static usage = Command.Usage({
    category: `Project`,
    description: `Create a new project`,
    details: `
      This command creates a new project interactively.
      You will be prompted for the project path and other configuration options.
    `,
    examples: [[`Create a new project`, `create project`]],
  });

  projectPath: string = "";
  executor: string = "";
  packageManager: string = "";
  linter: string = "";
  validation_library = Option.String("--validation-library", {
    description: "Validation library to use (yup, zod, none)",
    required: false,
  });
  database_type = Option.String("--database-type", {
    description: "Database type to use (postgresql, mysql, sqlite)",
    required: false,
  });
  cache_library = Option.String("--cache-library", {
    description: "Cache library to use (redis, memcached, none)",
    required: false,
  });
  mailer_library = Option.String("--mailer-library", {
    description:
      "Mailer library to use (@aws-sdk/client-ses, nodemailer, none)",
    required: false,
  });
  queue_library = Option.String("--queue-library", {
    description:
      "Queue library to use (@aws-sdk/client-sqs, @azure/service-bus, @google-cloud/pubsub, amqplib, redis, none)",
    required: false,
  });
  storage_library = Option.String("--storage-library", {
    description:
      "Storage library to use (@aws-sdk/client-s3, @azure/storage-blob, @google-cloud/storage, basic-ftp, ssh2-sftp-client, none)",
    required: false,
  });
  initGit = Option.Boolean("--git", {
    description: "Initialize a git repository (use --no-git to skip)",
    required: false,
  });

  async folderExists(folderPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(folderPath);
      return stats.isDirectory();
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false; // Folder does not exist
      }
      throw error; // Other errors (e.g., permission issues)
    }
  }

  async execute() {
    //setup project
    await this.setupProjectPath();
    await this.setupGit();
    await this.setupExecutorAndPackageManager();
    await this.setupLinter();
    await this.setupGeneralPackages();
    await this.setupBaseProject();
    await this.installPackages();
  }

  async processTplFolder(src: string, dest: string, data: any = {}) {
    const files = await fs.readdir(src, { withFileTypes: true });
    for (const file of files) {
      const srcPath = path.join(src, file.name);
      const destPath =
        file.isFile() && file.name.endsWith(".tpl")
          ? path.join(dest, file.name.substring(0, file.name.length - 4))
          : path.join(dest, file.name);

      if (file.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.processTplFolder(srcPath, destPath, data);
      } else if (file.name.endsWith(".tpl")) {
        await this.processTplFile(srcPath, destPath, data);
      } else {
        throw new Error(
          "unexpected non tpl file: " + srcPath + " " + file.name,
        );
      }
    }
  }

  async processTplFile(src: string, dest: string, data: any = {}) {
    handlebars.registerHelper("eq", (a, b) => a === b);

    const compiledTemplate = handlebars.compile(
      (await fs.readFile(src)).toString(),
    );
    const template = await compiledTemplate(data);
    await fs.writeFile(dest, template);
  }

  async setupProjectPath() {
    // Ask for project path
    const pathInput = await input({
      message: "Enter project path (leave empty to use current directory):",
      default: "",
    });

    // Create the project directory path
    this.projectPath = pathInput.trim()
      ? path.resolve(pathInput.trim())
      : process.cwd();

    // Create directory if it doesn't exist
    await fs.mkdir(this.projectPath, { recursive: true });

    // Check if directory is empty
    const files = await fs.readdir(this.projectPath);
    if (files.length > 0) {
      throw new Error(
        `Directory ${this.projectPath} is not empty. Please use an empty directory.`,
      );
    }
  }

  async setupExecutorAndPackageManager() {
    // ask what executor to use
    this.executor = await select({
      message: "Select a TypeScript executor",
      choices: [
        {
          name: "Bun",
          value: "bun",
          description: "Fast all-in-one JavaScript runtime",
        },
        {
          name: "TSX",
          value: "tsx",
          description:
            "TypeScript execute (tsx) - Node.js enhanced with esbuild",
        },
      ],
    });

    // ask what package manager to use (skip if executor is bun)
    this.packageManager =
      this.executor === "bun"
        ? "bun"
        : await select({
            message: "Select a package manager",
            choices: [
              {
                name: "Yarn",
                value: "yarn",
                description: "Fast, reliable, and secure dependency management",
              },
              {
                name: "npm",
                value: "npm",
                description: "Node package manager (default)",
              },
              {
                name: "Bun",
                value: "bun",
                description: "Ultra-fast package manager built into Bun",
              },
            ],
            default: "yarn",
          });

    // use executor as package manager to start a new project
    // run command to init a project with the selected executor and package manager
    execSync(`${this.packageManager} init -y`, {
      stdio: "inherit",
      cwd: this.projectPath,
    });

    // add commands to package.json based on the selected executor
    const packageJsonPath = path.join(this.projectPath, `package.json`);
    let packageJson = JSON.parse(await fs.readFile(packageJsonPath, `utf-8`));
    packageJson.type = "module";
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts.prepare = "husky init";
    packageJson.scripts.clean = "rm -rf dist";
    if (this.executor === "bun") {
      packageJson.scripts.dev = "bun run dev";
      packageJson.scripts.start = "bun run pdev";
      packageJson.scripts.build = "bun run build";
      packageJson.scripts.test = "vitest";
      packageJson.scripts["test:watch"] = "vitest --watch";
      packageJson.scripts["test:coverage"] = "vitest run --coverage";
    } else if (this.executor === "tsx") {
      packageJson.scripts.dev =
        "tsx --watch -r tsconfig-paths/register src/index.ts start --all | npx pino-pretty";
      packageJson.scripts.cli = "tsx -r tsconfig-paths/register src/index.ts";
      packageJson.scripts.start = "tsx dist/index.js";
      packageJson.scripts.build = "tsc";
      packageJson.scripts.test = "vitest";
      packageJson.scripts["test:watch"] = "vitest --watch";
      packageJson.scripts["test:coverage"] = "vitest run --coverage";
    }
    //save back to package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async setupLinter() {
    // ask what linter to use
    this.linter = await select({
      message: "Select a linter",
      choices: [
        {
          name: "Biome",
          value: "biome",
          description:
            "Fast formatter and linter for JavaScript, TypeScript, and more",
        },
        {
          name: "ESLint",
          value: "eslint",
          description: "Find and fix problems in your JavaScript code",
        },
        {
          name: "Oxlint",
          value: "oxlint",
          description:
            "Extremely fast JavaScript/TypeScript linter and formatter (oxlint + oxfmt)",
        },
      ],
    });

    // add linter configuration to package.json based on the selected linter
    const packageJsonPath = path.join(this.projectPath, `package.json`);
    let packageJson = JSON.parse(await fs.readFile(packageJsonPath, `utf-8`));
    if (this.linter === "biome") {
      packageJson.scripts.lint = "biome check . --ext .ts,.tsx";
      packageJson.scripts.format = "biome format . --ext .ts,.tsx --write";
      this.addPackage("@biomejs/biome", true);
    } else if (this.linter === "eslint") {
      packageJson.scripts.lint = "eslint . --ext .ts,.tsx";
      packageJson.scripts.format = "eslint . --ext .ts,.tsx --fix";
      this.addPackage("eslint", true);
    } else if (this.linter === "oxlint") {
      packageJson.scripts.lint = "oxlint .";
      packageJson.scripts.format = "oxfmt .";
      this.addPackage("oxlint", true);
      this.addPackage("@oxc-project/oxfmt", true);
    }
    //save back to package.json
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async setupGeneralPackages() {
    // ask what library to use for validation: yup or zod or none
    this.validation_library =
      this.validation_library ??
      (await select({
        message: "Select a package you want for validation",
        choices: [
          {
            name: "Yup",
            value: "yup",
            description: "https://github.com/jquense/yup",
          },
          {
            name: "Zod",
            value: "zod",
            description: "https://zod.dev/",
          },
          new Separator(),
          {
            name: "None",
            value: "none",
            disabled: false,
          },
        ],
      }));

    // run commands to install the selected validation library
    if (
      this.validation_library === "yup" ||
      this.validation_library === "zod"
    ) {
      await this.addPackage(this.validation_library);
    } else if (this.validation_library === "none") {
    } else {
      throw new Error(
        "unexpected validation library: " +
          this.validation_library +
          ". Valid options are: yup, zod, none",
      );
    }

    this.database_type =
      this.database_type ??
      (await select({
        message: "Select a database type (you can add more databases later)",
        choices: [
          {
            name: "PostgreSQL",
            value: "postgresql",
            description:
              "A powerful, open source object-relational database system",
          },
          {
            name: "MySQL",
            value: "mysql",
            description: "The world's most popular open source database",
          },
          {
            name: "SQLite",
            value: "sqlite",
            description:
              "A C library that provides a lightweight disk-based database",
          },
        ],
      }));

    if (this.database_type === "postgresql") {
      await this.addPackage("pg pg-cursor");
    } else if (this.database_type === "mysql") {
      await this.addPackage("mysql2");
    } else if (this.database_type === "sqlite") {
      await this.addPackage("sqlite3");
    } else {
      throw new Error(
        "unexpected database type: " +
          this.database_type +
          ". Valid options are: postgresql, mysql, sqlite",
      );
    }

    // ask for cache library to use
    this.cache_library =
      this.cache_library ??
      (await select({
        message: "Select a cache library",
        choices: [
          {
            name: "Redis",
            value: "redis",
            description: "Redis client for Node.js",
          },
          {
            name: "Memcached",
            value: "memcached",
            description: "Memcached client for Node.js",
          },
          new Separator(),
          {
            name: "None",
            value: "none",
            disabled: false,
          },
        ],
      }));

    if (this.cache_library === "redis") {
      await this.addPackage("redis");
    } else if (this.cache_library === "memcached") {
      await this.addPackage("memcached");
    } else if (this.cache_library === "none") {
    } else {
      throw new Error(
        "unexpected cache library: " +
          this.cache_library +
          ". Valid options are: redis, memcached, none",
      );
    }

    // ask for mailer library to use
    this.mailer_library =
      this.mailer_library ??
      (await select({
        message: "Select a mailer library",
        choices: [
          {
            name: "AWS SES",
            value: "@aws-sdk/client-ses",
            description: "AWS SDK for JavaScript v3 - SES client",
          },
          {
            name: "Nodemailer",
            value: "nodemailer",
            description: "Send emails with Node.js",
          },
          new Separator(),
          {
            name: "None",
            value: "none",
            disabled: false,
          },
        ],
      }));

    if (this.mailer_library === "@aws-sdk/client-ses") {
      await this.addPackage("@aws-sdk/client-ses");
    } else if (this.mailer_library === "nodemailer") {
      await this.addPackage("nodemailer");
      await this.addPackage("@types/nodemailer", true);
    } else if (this.mailer_library === "none") {
    } else {
      throw new Error(
        "unexpected mailer library: " +
          this.mailer_library +
          ". Valid options are: @aws-sdk/client-ses, nodemailer, none",
      );
    }

    // ask for queue library to use
    this.queue_library =
      this.queue_library ??
      (await select({
        message: "Select a queue library",
        choices: [
          {
            name: "AWS SQS",
            value: "@aws-sdk/client-sqs",
            description: "AWS SDK for JavaScript v3 - SQS client",
          },
          {
            name: "Azure Service Bus",
            value: "@azure/service-bus",
            description: "Azure Service Bus client for Node.js",
          },
          {
            name: "Google Cloud Pub/Sub",
            value: "@google-cloud/pubsub",
            description: "Google Cloud Pub/Sub client for Node.js",
          },
          {
            name: "RabbitMQ (amqplib)",
            value: "amqplib",
            description: "AMQP 0-9-1 client for Node.js",
          },
          {
            name: "Redis",
            value: "redis",
            description: "Redis client for Node.js",
          },
          new Separator(),
          {
            name: "None",
            value: "none",
            disabled: false,
          },
        ],
      }));

    if (this.queue_library === "@aws-sdk/client-sqs") {
      await this.addPackage("@aws-sdk/client-sqs");
    } else if (this.queue_library === "@azure/service-bus") {
      await this.addPackage("@azure/service-bus");
    } else if (this.queue_library === "@google-cloud/pubsub") {
      await this.addPackage("@google-cloud/pubsub");
    } else if (this.queue_library === "amqplib") {
      await this.addPackage("amqplib");
      await this.addPackage("@types/amqplib", true);
    } else if (this.queue_library === "redis") {
      await this.addPackage("redis");
    } else if (this.queue_library === "none") {
    } else {
      throw new Error(
        "unexpected queue library: " +
          this.queue_library +
          ". Valid options are: @aws-sdk/client-sqs, @azure/service-bus, @google-cloud/pubsub, amqplib, redis, none",
      );
    }

    // ask for storage library to use
    this.storage_library =
      this.storage_library ??
      (await select({
        message: "Select a storage library",
        choices: [
          {
            name: "@aws-sdk/client-s3",
            value: "@aws-sdk/client-s3",
            description: "AWS SDK for JavaScript v3 - S3 client",
          },
          {
            name: "@azure/storage-blob",
            value: "@azure/storage-blob",
            description: "Azure Storage Blob client for Node.js",
          },
          {
            name: "@google-cloud/storage",
            value: "@google-cloud/storage",
            description: "Google Cloud Storage client for Node.js",
          },
          {
            name: "basic-ftp",
            value: "basic-ftp",
            description: "FTP client for Node.js",
          },
          {
            name: "ssh2-sftp-client",
            value: "ssh2-sftp-client",
            description: "SFTP client for Node.js",
          },
          new Separator(),
          {
            name: "None",
            value: "none",
            disabled: false,
          },
        ],
      }));

    if (this.storage_library === "@aws-sdk/client-s3") {
      await this.addPackage("@aws-sdk/client-s3");
    } else if (this.storage_library === "@azure/storage-blob") {
      await this.addPackage("@azure/storage-blob");
    } else if (this.storage_library === "@google-cloud/storage") {
      await this.addPackage("@google-cloud/storage");
    } else if (this.storage_library === "basic-ftp") {
      await this.addPackage("basic-ftp");
    } else if (this.storage_library === "ssh2-sftp-client") {
      await this.addPackage("ssh2-sftp-client");
      await this.addPackage("@types/ssh2-sftp-client", true);
    } else if (this.storage_library === "none") {
    } else {
      throw new Error(
        "unexpected storage library: " +
          this.storage_library +
          " . Valid options are: @aws-sdk/client-s3, @azure/storage-blob, @google-cloud/storage, basic-ftp, ssh2-sftp-client, none",
      );
    }

    // add other packages
    await this.addPackage("@devbro/pashmak tsconfig-paths dotenv ");
    await this.addPackage(
      "husky vitest supertest @types/supertest pino-pretty typescript tsx",
      true,
    );
  }

  async setupBaseProject() {
    console.log(`Using project directory: ${this.projectPath}`);

    const dirname =
      typeof __dirname === "undefined"
        ? path.dirname(fileURLToPath(import.meta.url))
        : __dirname;

    let basePath = path.join(dirname, `./base_project`);
    if ((await this.folderExists(basePath)) === false) {
      // we are running a compiled code that was bundled and the code is running from ./dist/bin/ folder.
      basePath = path.join(dirname, `../app/console/project/base_project`);
    }

    console.log(`Using base project path: ${basePath}`);
    //copy content of ./base_project to the new project directory
    const baseProjectPath = basePath;

    await this.processTplFolder(baseProjectPath, this.projectPath, {
      validation_library: this.validation_library,
      executor: this.executor,
      package_manager: this.packageManager,
      linter: this.linter,
      database_type: this.database_type,
    });
    console.log(`Copied base project files to: ${this.projectPath}`);

    //modify package.json with foldername
    const packageJsonPath = path.join(this.projectPath, "package.json");
    let packageJson = JSON.parse(await fs.readFile(packageJsonPath, `utf-8`));
    packageJson.name = Case.snake(path.basename(this.projectPath));

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json with project name: ${packageJson.name}`);
  }

  async addPackage(packageName: string, dev: boolean = false) {
    let install_command = "";
    switch (this.packageManager) {
      case "bun":
        install_command = `bun add ${packageName}${dev ? " -d" : ""}`;
        break;
      case "yarn":
        install_command = `yarn add ${packageName}${dev ? " -D" : ""} --no-install`;
        break;
      case "npm":
        install_command = `npm install ${packageName}${dev ? " --save-dev" : ""} --package-lock-only`;
        break;
    }

    execSync(install_command, {
      stdio: "inherit",
      cwd: this.projectPath,
    });
  }

  async installPackages() {
    const install_command =
      this.packageManager === "bun"
        ? `bun install`
        : this.packageManager === "yarn"
          ? `yarn`
          : `npm install`;

    execSync(install_command, {
      stdio: "inherit",
      cwd: this.projectPath,
    });
  }

  async setupGit() {
    // ask if user wants to initialize git repository
    this.initGit =
      this.initGit ??
      (await select({
        message: "Initialize a git repository?",
        choices: [
          {
            name: "Yes",
            value: true,
            description: "Initialize git and create first commit",
          },
          {
            name: "No",
            value: false,
            description: "Skip git initialization",
          },
        ],
      }));

    if (this.initGit) {
      const gitignoreContent =
        [
          "node_modules/",
          "dist/",
          ".env",
          ".env.*",
          "!.env.example",
          "*.log",
          "coverage/",
          ".DS_Store",
        ].join("\n") + "\n";

      await fs.writeFile(
        path.join(this.projectPath, ".gitignore"),
        gitignoreContent,
      );

      execSync(
        `git init; git add --all; git commit --allow-empty -m "chore: first commit"`,
        {
          cwd: this.projectPath,
        },
      );
    }
  }

  async catch(error: unknown) {
    if (Error.isError(error)) {
      console.error(error.message);
    } else {
      console.error(error);
    }
  }
}
