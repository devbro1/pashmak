---
sidebar_position: 12
---

# API Documentation Generation

Pashmak includes a built-in command to help you generate OpenAPI 3.0 documentation. This makes it easy to maintain up-to-date API documentation without manual effort.

## Configuration

```ts
// default.ts
export default {
  ???,
  api_docs: {
    url: getEnv('API_DOC_URL', 'http://localhost:' + getEnv('PORT', '3000') + '/openapi.json'),
    merge_files: [
      path.join(__dirname, '../..', 'private', 'openapi_base.json'),
      path.join(__dirname, '../..', 'private', 'openapi_examples.json'),
      path.join(__dirname, '../..', 'private', 'openapi_user_changes.json'),
    ],
    output: path.join(__dirname, '../..', 'public', 'openapi.json'),
  },
}
```

## Available Commands

the main assistance comes from command line:

```bash
# to generate a basic json file for openapi 3.0 docs
npm run generate apidocs --generate-base --output path/to/output.json

# to generate list of routes for all registered routes
npm run generate apidocs --generate-from-routes --output path/to/output.json

# merge all files defined in config apidocs.merge_files into one file into apidocs.output
npm run generate apidocs --merge-files
```

## Registering Actual OpenApi Route

If you want to provide a quick page to view your api documents simply add following to your routes:

```ts
router.addRoute(
  ["GET"],
  "/api/docs",
  ApiDocumentation(config.getOrFail("api_docs.url"), "rapidoc"),
);
```

Currently you can use `rapidoc` or `redoc` for rendering.

## Creating Examples from Tests

You can use your tests to generate examples for api-docs. To do so, just pass a response object from supertest to `saveForApiDoc`.

```ts
import supertest from "supertest";
import { httpServer } from "@devbro/pashmak/facades";
import { saveForApiDoc } from "./helpers";

const server = httpServer();
const s = supertest(server.getHttpHanlder());

let updateResponse = await s
  .put(`/api/v1/cats/${cat_id}`)
  .set("Authorization", `Bearer ${accessToken}`)
  .send({
    name: "Mainecoon",
    weight: "100KG",
  });

await saveForApiDoc(updateResponse, {
  example_name: "Updating a cat breed details",
  tags: ["Cats"],
  routePath: "/api/v1/cats/:id",
});
```

The code for this method is part of your project so you can make adjustments as needed. Here are some details to have in mind:

- You can pass name of example and tags to help organize your examples.
- routePath is optional but strongly recommended to be passed. Currently the method cannot determine which part is url parameter so this is needd to determine which route the example should be added for.
- If `Authorization` header exists, it will automatically mark the endpoint as authentication required.
- It can be beneficial to have tests with apidocs tagged to improve performance of document generation

## Generating different apidocs

There may be situations that you want to generate different sets of api-docs. An example of this would be when you want to generate one for public release, another one for internal use, and a third for pen testers. To make this you can create multiple entries in your config file:

```ts
// src/config/default.ts
export default {
  ???,
  api_docs: ???,
  api_docs_internal: ???,
  pen_testers: {
    api_docs: ???,
  },
}
```

once you have different configs, you can run different merge commands:

```bash
# use api_docs as default
npm run generate apidocs --merge-files

# use api_docs_internal for merge process
npm run generate apidocs --merge-files --config api_docs_internal

# use { pen_testers: { api_docs: ??? } } for merge process
npm run generate apidocs --merge-files --config pen_testers.api_docs
```

## Best practices

Pashmak creates api docs by merging multiple json files into a single api doc file. As a result you can
have each portion of the doc created separately.

- Use base api doc to start. it is the fastest way to start with documentations
- Keep different portions of api docs based on how they need to be generated. Examples can be generated independently so have those parts in different parts.
- Opt for statically created api-docs. This way you can control what your end users see and not disclose endpoints that are not meant for external users.
- Use tests to create your examples. This is beneficials to save time in managing api-docs and give actual examples that work!
- Add CI pipelines to autogenerate and commit your new api docs.
