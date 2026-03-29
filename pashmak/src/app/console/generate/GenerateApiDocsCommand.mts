/*
how this command should work:
<command> generate-from-routes --output path/to/output.json
<command> generate-base --output path/to/output.json
<command> merge-files # file lists/details are in config
<command> # will show help
*/
import { cli, router } from "../../../facades.mjs";
import { Command, Option } from "clipanion";
import path from "path";
import * as fs from "fs/promises";
import { config } from "../../../config.mjs";
import { Arr } from "@devbro/neko-helper";

export class GenerateApiDocsCommand extends Command {
  static paths = [[`generate`, `apidocs`]];

  static usage = Command.Usage({
    category: `Generate`,
    description: `Generate OpenAPI documentation from routes`,
    details: `
      This command utility generates OpenAPI 3.0 specification documentation by analyzing
      your application's routes and merging with example files.
      
      Subcommands:
      - generate-from-routes: Generate OpenAPI spec from registered routes
      - generate-base: Generate base OpenAPI specification structure
      - merge-files: Merge multiple OpenAPI files into final documentation

      
      This command depends on config data. make sure your default config contains the following:

\`\`\`
api_docs: {

  merge_files: [

    path.join(__dirname, '../..', 'private', 'openapi_base.json'),

    path.join(__dirname, '../..', 'private', 'openapi_from_routes.json'),

    path.join(__dirname, '../..', 'private', 'openapi_from_tests.json'),

    path.join(__dirname, '../..', 'private', 'openapi_other_user_changes.json'),

  ],

  output: path.join(__dirname, '../..', 'public', 'openapi.json'),

}

\`\`\`
    `,
    examples: [
      [
        `Generate from routes`,
        `$0 generate apidocs generate-from-routes --output path/to/output.json`,
      ],
      [
        `Generate base spec`,
        `$0 generate apidocs generate-base --output path/to/output.json`,
      ],
      [`Merge files`, `$0 generate apidocs merge-files`],
      [`Show help`, `$0 generate apidocs --help`],
    ],
  });

  subcommand = Option.String({ required: false });

  output = Option.String(`--output,-o`, {
    description: `Output file path for generated documentation`,
  });

  config = Option.String(`--config,-c`, {
    description: `Path in config to get details from (default: api_docs)`,
    required: false,
  });

  async execute() {
    if (!this.subcommand) {
      this.context.stdout.write(
        this.constructor.usage?.toString() || "No help available\n",
      );
      return 0;
    }

    switch (this.subcommand) {
      case "generate-from-routes":
        return await this.executeGenerateFromRoutes();
      case "generate-base":
        return await this.executeGenerateBase();
      case "merge-files":
        return await this.executeMergeFiles();
      default:
        this.context.stderr.write(`Unknown subcommand: ${this.subcommand}\n`);
        this.context.stdout.write(
          this.constructor.usage?.toString() || "No help available\n",
        );
        return 1;
    }
  }

  private async executeGenerateFromRoutes() {
    this.context.stdout.write(
      `Generating OpenAPI documentation from routes...\n`,
    );

    const openApiSpec = this.generateFromRoutes();
    const outputPath =
      this.output ||
      path.join(config.get("private_path"), "openapi_from_routes.json");

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(
      outputPath,
      JSON.stringify(openApiSpec, null, 2),
      "utf-8",
    );

    this.context.stdout.write(
      `OpenAPI routes documentation generated at: ${outputPath}\n`,
    );
    this.context.stdout.write(
      `Total routes documented: ${Object.keys(openApiSpec.paths).length}\n`,
    );
    return 0;
  }

  private async executeGenerateBase() {
    this.context.stdout.write(`Generating base OpenAPI specification...\n`);

    const baseSpec = this.getBaseOpenApiSpec();
    const outputPath =
      this.output || path.join(config.get("private_path"), "openapi_base.json");

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(baseSpec, null, 2), "utf-8");

    this.context.stdout.write(
      `Base OpenAPI specification generated at: ${outputPath}\n`,
    );
    return 0;
  }

  private async executeMergeFiles() {
    this.context.stdout.write(`Merging OpenAPI files...\n`);
    let configPath = this.config || "api_docs";

    const files_to_merge: string[] = config.get(`${configPath}.merge_files`);
    let final_api_docs = {};

    for (const file_path of files_to_merge) {
      try {
        const file_json = JSON.parse(await fs.readFile(file_path, "utf8"));
        final_api_docs = Arr.deepMerge(final_api_docs, file_json);
        this.context.stdout.write(`  Merged: ${file_path}\n`);
      } catch (error) {
        this.context.stderr.write(
          `  Warning: Could not read ${file_path}: ${(error as Error).message}\n`,
        );
      }
    }

    const outputPath = this.output || config.get(`${configPath}.output`);

    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await fs.writeFile(outputPath, JSON.stringify(final_api_docs, null, 2));

    this.context.stdout.write(
      `Final OpenAPI document written to: ${outputPath}\n`,
    );
    return 0;
  }

  private extractParameters(routePath: string): any[] {
    const paramRegex = /:([a-zA-Z0-9_]+)/g;
    const parameters: any[] = [];
    let match;

    while ((match = paramRegex.exec(routePath)) !== null) {
      parameters.push({
        name: match[1],
        in: "path",
        required: true,
        schema: {
          type: "string",
        },
        description: `Path parameter ${match[1]}`,
      });
    }

    return parameters;
  }

  private generateFromRoutes() {
    const openApiSpec = {
      paths: {} as any,
    };
    const routes = router().routes;

    // Process each route
    for (const route of routes) {
      const routePath = route.path;
      // Convert route path to OpenAPI format (e.g., /api/:id -> /api/{id})
      const openApiPath = routePath.replace(/\/$/g, ""); //.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

      if (!openApiSpec.paths[openApiPath]) {
        openApiSpec.paths[openApiPath] = {};
      }

      // Add each HTTP method for this route
      for (const method of route.methods) {
        const lowerMethod = method.toLowerCase();

        // Skip HEAD as it's usually auto-generated
        if (lowerMethod === "head") {
          continue;
        }

        openApiSpec.paths[openApiPath][lowerMethod] = {
          summary: `${routePath}`,
          description: `Endpoint for ${method} ${routePath}`,
          security: [],
          parameters: this.extractParameters(routePath),
          responses: {},
        };

        // Add request body for POST, PUT, PATCH
        if (["post", "put", "patch"].includes(lowerMethod)) {
          openApiSpec.paths[openApiPath][lowerMethod].requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                },
              },
            },
          };
        }
      }
    }

    return openApiSpec;
  }

  getBaseOpenApiSpec() {
    // Generate OpenAPI 3.0 specification
    const openApiSpec = {
      openapi: "3.0.0",
      info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "Auto-generated API documentation",
      },
      servers: [
        {
          url: "/",
          description: "Local server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT token authentication",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      paths: {} as Record<string, any>,
    };

    return openApiSpec;
  }
}

cli().register(GenerateApiDocsCommand);
