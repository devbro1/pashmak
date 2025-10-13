import { cli, router } from "../../../facades.mjs";
import { Command } from "clipanion";
import path from "path";
import * as fs from "fs/promises";

export class GenerateApiDocsCommand extends Command {
  static paths = [
    [`make`, `apidocs`],
    [`generate`, `apidocs`],
  ];

  async execute() {
    const rootDir = process.cwd();

    this.context.stdout.write(`Generating OpenAPI documentation...\n`);

    // Get all routes from the router
    const routes = router().routes;

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
      paths: {} as Record<string, any>,
    };

    // Process each route
    for (const route of routes) {
      const routePath = route.path;
      // Convert route path to OpenAPI format (e.g., /api/:id -> /api/{id})
      const openApiPath = routePath.replace(/:([a-zA-Z0-9_]+)/g, "{$1}");

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
          summary: `${method} ${routePath}`,
          description: `Endpoint for ${method} ${routePath}`,
          parameters: this.extractParameters(routePath),
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
            "500": {
              description: "Internal server error",
            },
          },
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

    // Ensure public directory exists
    const publicDir = path.join(rootDir, "public");
    await fs.mkdir(publicDir, { recursive: true });

    // Write the OpenAPI spec to public/openapi.json
    const outputPath = path.join(publicDir, "openapi.json");
    await fs.writeFile(
      outputPath,
      JSON.stringify(openApiSpec, null, 2),
      "utf-8"
    );

    this.context.stdout.write(
      `OpenAPI documentation generated at: ${outputPath}\n`
    );
    this.context.stdout.write(`Total routes documented: ${routes.length}\n`);
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
}

cli().register(GenerateApiDocsCommand);
