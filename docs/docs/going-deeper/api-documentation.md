---
sidebar_position: 10
---

# API Documentation Generation

Pashmak includes a built-in command to automatically generate OpenAPI 3.0 documentation from your routes. This makes it easy to maintain up-to-date API documentation without manual effort.

## Overview

The API documentation generator analyzes your application's routes and creates an OpenAPI specification that includes:

- All registered routes with their HTTP methods
- Path parameters extracted from route definitions
- Request body schemas for POST, PUT, and PATCH methods
- Response schemas
- Route descriptions and metadata

## Quick Start

Generate API documentation with a single command:

```bash
pashmak generate apidocs
# or
pashmak make apidocs
```

This will create an `openapi.json` file in your project's `private` directory.

## Configuration

The API documentation generator relies on configuration in your `config/default.ts` file:

```ts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // ... other config

  api_docs: {
    // Files to merge with the generated documentation
    merge_files: [
      path.join(__dirname, '../..', 'private', 'openapi_examples.json'),
      path.join(__dirname, '../..', 'private', 'openapi_base.json'),
      path.join(__dirname, '../..', 'private', 'openapi_user_changes.json'),
    ],
    // Output path for the final OpenAPI document
    output: path.join(__dirname, '../..', 'public', 'openapi.json'),
  },
};
```

## Generated Documentation Structure

The generator creates a basic OpenAPI 3.0 specification:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "API Documentation",
    "version": "1.0.0",
    "description": "Auto-generated API documentation"
  },
  "servers": [
    {
      "url": "/",
      "description": "Local server"
    }
  ],
  "paths": {
    "/api/v1/users": {
      "get": {
        "summary": "GET /api/v1/users",
        "description": "Endpoint for GET /api/v1/users",
        "responses": {
          "200": {
            "description": "Successful response"
          }
        }
      },
      "post": {
        "summary": "POST /api/v1/users",
        "description": "Endpoint for POST /api/v1/users",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful response"
          }
        }
      }
    }
  }
}
```

## Route Parameter Detection

The generator automatically detects and documents route parameters:

```ts
// This route definition
router().addRoute(["GET"], "/api/users/:userId/posts/:postId", handler);

// Generates this OpenAPI documentation
{
  "/api/users/{userId}/posts/{postId}": {
    "get": {
      "parameters": [
        {
          "name": "userId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "Path parameter userId"
        },
        {
          "name": "postId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "Path parameter postId"
        }
      ]
    }
  }
}
```

## Customizing Documentation

### Base Information

Create an `openapi_base.json` file in your `private` directory to customize the API information:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My Awesome API",
    "version": "1.0.0",
    "description": "This is my awesome API built with Pashmak",
    "contact": {
      "name": "API Support",
      "email": "support@example.com"
    },
    "license": {
      "name": "MIT",
      "url": "https://opensource.org/licenses/MIT"
    }
  },
  "servers": [
    {
      "url": "https://api.example.com",
      "description": "Production server"
    },
    {
      "url": "https://staging-api.example.com",
      "description": "Staging server"
    }
  ]
}
```

### Adding Examples

Create an `openapi_examples.json` file to add request and response examples:

```json
{
  "paths": {
    "/api/v1/users": {
      "post": {
        "requestBody": {
          "content": {
            "application/json": {
              "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "age": 30
              }
            }
          }
        },
        "responses": {
          "200": {
            "content": {
              "application/json": {
                "example": {
                  "id": 1,
                  "name": "John Doe",
                  "email": "john@example.com",
                  "age": 30,
                  "createdAt": "2024-01-01T00:00:00Z"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Custom Modifications

Create an `openapi_user_changes.json` file for any custom modifications:

```json
{
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "paths": {
    "/api/v1/users": {
      "get": {
        "tags": ["Users"],
        "summary": "List all users",
        "description": "Retrieve a list of all users in the system"
      }
    }
  }
}
```

## Merging Process

The generator merges files in the order specified in your configuration:

1. Generates base documentation from routes
2. Merges `openapi_examples.json`
3. Merges `openapi_base.json`
4. Merges `openapi_user_changes.json`
5. Writes final result to the output path

Later files in the merge order override earlier ones, allowing you to customize any part of the generated documentation.

## Viewing Documentation

### Using Swagger UI

You can serve the generated OpenAPI specification using Swagger UI:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    npm install swagger-ui-express
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    yarn add swagger-ui-express
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm add swagger-ui-express
    ```
  </TabItem>
</Tabs>

Then add a route to serve the documentation:

```ts
import { router } from "@devbro/pashmak/facades";
import { Request, Response } from "@devbro/pashmak/router";
import swaggerUi from "swagger-ui-express";
import fs from "fs/promises";
import path from "path";

// Load OpenAPI spec
const openapiSpec = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "public", "openapi.json"),
    "utf-8"
  )
);

// Serve Swagger UI
router().addRoute(
  ["GET"],
  "/api-docs",
  async (req: Request, res: Response) => {
    const html = swaggerUi.generateHTML(openapiSpec);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
);
```

### Using Redoc

Alternatively, you can use Redoc for a different documentation style:

```bash
npm install redoc
```

## Best Practices

1. **Generate regularly**: Run the documentation generator after adding or modifying routes
2. **Version control**: Commit the generated `openapi.json` file to version control
3. **Customize thoughtfully**: Use merge files to add meaningful descriptions and examples
4. **Keep examples realistic**: Use actual data structures in your examples
5. **Document security**: Include authentication/authorization requirements in your custom files
6. **Add tags**: Use tags in custom files to organize endpoints logically

## CI/CD Integration

Add API documentation generation to your CI/CD pipeline:

```yaml
# .github/workflows/docs.yml
name: Generate API Docs

on:
  push:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: pashmak generate apidocs
      - name: Commit docs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/openapi.json
          git commit -m "Update API documentation" || echo "No changes"
          git push
```

## Troubleshooting

### Documentation not generating

Make sure:
- Your routes are registered before running the command
- The `private_path` configuration is set correctly
- You have write permissions to the output directory

### Missing routes

Ensure all controllers are registered with the router:

```ts
import { router } from "@devbro/pashmak/facades";
import { MyController } from "./app/controllers/MyController";

router().addController(MyController);
```

### Merge files not found

Check that the paths in `api_docs.merge_files` are correct. You can use absolute paths or paths relative to your config file.
