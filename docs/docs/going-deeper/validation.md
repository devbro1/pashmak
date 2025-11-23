---
sidebar_position: 9
---

# Validation

Pashmak does not implement its own validation library. Instead, it provides built-in validation support through the `@ValidatedRequest` decorator, which integrates with popular validation libraries like Yup and Zod.

During creating a new pashmak project, you can choose to include validation support with Yup or Zod. If you did not include it during project creation, you can manually add validation support by installing the required packages and adjusting `src/helpers/validation.ts`.

if you decide to use Both Yup and Zod, you can do that as well:

```ts
export function ValidatedRequest(
  validationRules:
    | yup.ObjectSchema<any>
    | (() => yup.ObjectSchema<any>)
    | z.ZodType<any>
    | (() => z.ZodType<any>),
): ParameterDecorator {
  return createParamDecorator(async () => {
    const schema =
      typeof validationRules === "function"
        ? validationRules()
        : validationRules;
    const requestBody = ctx().get<Request>("request").body;

    // Check if it's a Zod schema by checking for parse method
    if ("parse" in schema && typeof schema.parse === "function") {
      return await schema.parseAsync(requestBody);
    }

    // Otherwise, treat it as Yup schema
    const rc = await (schema as yup.ObjectSchema<any>)
      .noUnknown()
      .validate(requestBody, { abortEarly: false });

    return rc;
  });
}
```

## Using Yup Validation

Yup is a schema validation library that provides an intuitive API for validating objects.

### Basic Example

```ts
import * as yup from "yup";
import { BaseController, Controller, Post } from "@devbro/pashmak/router";
import { ValidatedRequest } from "@/helpers/validation";

@Controller("/api/v1/users")
export class UserController extends BaseController {
  static createUserSchema = yup.object({
    name: yup.string().required().min(2).max(100),
    email: yup.string().email().required(),
    age: yup.number().positive().integer().min(18),
  });

  @Post()
  async create(@ValidatedRequest(UserController.createUserSchema) data: any) {
    // data is validated and contains: { name, email, age }
    return await User.create(data);
  }
}
```

#### Dynamic Schema

You can also use a function to generate schemas dynamically:

```ts

const validationFunc = () => {
  if (someCondition) {
    return yup.object({
      title: yup.string().required().min(10).max(100),
      content: yup.string().required().min(50),
      published: yup.boolean().default(true),
    });
  }

  return yup.object({
    title: yup.string().required().min(5).max(200),
    content: yup.string().required().min(20),
  });
};


@Post()
async update(@ValidatedRequest(validationFunc) data: any) {
  // Update logic
}
```

## Using Zod Validation

Zod is a TypeScript-first schema validation library with static type inference.

```ts
import { z } from "zod";
import { BaseController, Controller, Post } from "@devbro/pashmak/router";
import { ValidatedRequest } from "@/helpers/validation";

@Controller("/api/v1/posts")
export class PostController extends BaseController {
  static createPostSchema = z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(10),
    published: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  });

  @Post()
  async create(@ValidatedRequest(PostController.createPostSchema) data: any) {
    // data is validated and type-safe
    return await Post.create(data);
  }
}
```

### Dynamic Schema

Zod validation schemas can also be generated dynamically using functions:

```ts
const validationFunc = () => {
  if (someCondition) {
    return z.object({
      title: z.string().min(10).max(100),
      content: z.string().min(50),
      published: z.boolean().default(true),
    });
  }

  return z.object({
    title: z.string().min(5).max(200),
    content: z.string().min(20),
  });
};

@Post()
async update(@ValidatedRequest(validationFunc) data: any) {
  // Update logic
}
```

## Error Handling

When validation fails, it is expected that an error is thrown. You can catch these errors in your httpServer error handler:

```ts
// src/initialize.ts

httpServer().setErrorHandler(async (err: Error, req: any, res: any) => {
  if (err instanceof HttpError) {
    res.writeHead(err.statusCode, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: err.message, error: err.code }));
    logger().warn({ msg: "HttpError: " + err.message, err });
    return;
  } else if (err instanceof ZodError) {
    res.writeHead(422, { "Content-Type": "application/json" });
    const { errors } = z.treeifyError(err);

    res.write(JSON.stringify({ message: "validation error", errors: errors }));
    logger().warn({ msg: "ZodError: " + err.message, err });
    return;
  } else if (err instanceof yup.ValidationError) {
    res.writeHead(422, { "Content-Type": "application/json" });
    const errs: any = {};
    err.inner.forEach((e: yup.ValidationError) => {
      // Sanitize sensitive fields
      const sanitizedParams = { ...e.params };
      if (/passw/i.test(e.path!)) {
        sanitizedParams.value = "******";
        sanitizedParams.originalValue = "******";
      }

      errs[e.path!] = {
        type: e.type,
        message: e.message,
        params: sanitizedParams,
      };
    });

    res.write(JSON.stringify({ message: "validation error", errors: errs }));
    logger().warn({ msg: "ValidationError: " + err.message, err });
    return;
  } else {
    logger().error({ msg: "Error: " + err.message, err });
  }
  res.writeHead(500, { "Content-Type": "" });
  res.write(JSON.stringify({ error: "Internal Server Error" }));
});
```

## Validation Best Practices

1. **Reuse schemas**: Create common validation schemas in a shared location
2. **Provide clear error messages**: Use clear and specific error messages for better user experience
3. **Validate early**: Use validation to catch errors before they reach your controllers or services
4. **Type safety**: Leverage TypeScript types whenever possible for end-to-end type safety
