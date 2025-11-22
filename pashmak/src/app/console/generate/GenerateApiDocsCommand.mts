/*
how this command should work:
command --generate-from-routes --output path/to/output.json
command --generate-base --output path/to/output.json
command --merge-files # file lists/details are in config
*/
import { cli, router } from "@devbro/pashmak/facades";
import { Command, Option } from "clipanion";
import path from "path";
import * as fs from "fs/promises";
import { config } from "@devbro/pashmak/config";
import { Arr } from "@devbro/neko-helper";

export class GenerateApiDocsCommand extends Command {
  static paths = [[`generate`, `apidocsv2`]];

  static usage = Command.Usage({
    category: `Generate`,
    description: `Generate OpenAPI documentation from routes`,
    details: `
      This command generates OpenAPI 3.0 specification documentation by analyzing
      your application's routes and merging with example files.
      
      The generated documentation includes:
      - All registered routes with their HTTP methods
      - Path parameters extracted from route definitions
      - Request body schemas for POST, PUT, and PATCH methods
      - Response schemas
      
      The command will merge files specified in config.api_docs.merge_files
      and output the final documentation to config.api_docs.output.

      This command depends on config data. make sure your default config contains the following:
      api_docs: {
        merge_files: [
          path.join(__dirname, '../..', 'private', 'openapi_examples.json'),
          path.join(__dirname, '../..', 'private', 'openapi_base.json'),
          path.join(__dirname, '../..', 'private', 'openapi_user_changes.json'),
        ],
        output: path.join(__dirname, '../..', 'private', 'openapi.json'),
      }
    `,
    examples: [
      [
        `Generate API documentation from registered routes`,
        `$0 --generate-from-routes --output path/to/output.json`,
      ],
      [
        `Generate base API documentation`,
        `$0 --generate-base --output path/to/output.json`,
      ],
      [`Merge API documentation files`, `$0 --merge-files`],
    ],
  });

  help = Option.Boolean(`--help,-h`, false, {
    description: `Show help message for this command`,
  });

  async execute() {
    if (this.help) {
      this.context.stdout.write(
        this.constructor.usage?.toString() || "No help available\n",
      );
      return 0;
    }

    const rootDir = process.cwd();

    this.context.stdout.write(`Generating OpenAPI documentation...\n`);

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

    // Ensure public directory exists
    await fs.mkdir(config.get("private_path"), { recursive: true });

    // Write the OpenAPI spec to public/openapi.json
    const outputPath = path.join(config.get("private_path"), "openapi.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(openApiSpec, null, 2),
      "utf-8",
    );

    this.context.stdout.write(
      `OpenAPI documentation generated at: ${outputPath}\n`,
    );
    // this.context.stdout.write(`Total routes documented: ${routes.length}\n`);

    let files_to_merge: string[] = config.get("api_docs.merge_files");
    let final_api_docs = {};
    for (let file_path of files_to_merge) {
      let file_json = JSON.parse(await fs.readFile(file_path, "utf8"));
      final_api_docs = Arr.deepMerge(final_api_docs, file_json, {
        arrayMergeStrategy: "concat",
      });
    }

    await fs.writeFile(
      config.get("api_docs.output"),
      JSON.stringify(final_api_docs, null, 2),
    );

    this.context.stdout.write(
      `wrote final open api document to : ${config.get("api_docs.output")}\n`,
    );
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
}

cli().register(GenerateApiDocsCommand);
