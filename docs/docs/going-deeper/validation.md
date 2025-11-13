---
sidebar_position: 9
---

# Validation

Pashmak provides built-in validation support through the `@ValidatedRequest` decorator, which integrates with popular validation libraries like Yup and Zod.

## Installation

The validation libraries need to be installed separately:

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-manager">
  <TabItem value="npm" label="npm" default>
    ```bash
    # Install Yup
    npm install yup
    
    # Or install Zod
    npm install zod
    ```
  </TabItem>
  <TabItem value="yarn" label="Yarn">
    ```bash
    # Install Yup
    yarn add yup
    
    # Or install Zod
    yarn add zod
    ```
  </TabItem>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    # Install Yup
    pnpm add yup
    
    # Or install Zod
    pnpm add zod
    ```
  </TabItem>
</Tabs>

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

### Dynamic Schema

You can also use a function to generate schemas dynamically:

```ts
@Post()
async update(@ValidatedRequest(() => {
  return yup.object({
    name: yup.string().min(2).max(100),
    email: yup.string().email(),
  });
}) data: any) {
  // Update logic
}
```

### Advanced Yup Validation

```ts
const registerSchema = yup.object({
  username: yup.string()
    .required()
    .min(3)
    .max(20)
    .matches(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  
  email: yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  
  password: yup.string()
    .required()
    .min(8, "Password must be at least 8 characters")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number"),
  
  confirmPassword: yup.string()
    .required()
    .oneOf([yup.ref('password')], "Passwords must match"),
  
  age: yup.number()
    .positive()
    .integer()
    .min(18, "Must be at least 18 years old")
    .max(120, "Invalid age"),
  
  role: yup.string()
    .oneOf(['user', 'admin', 'moderator'], "Invalid role")
    .default('user'),
  
  terms: yup.boolean()
    .oneOf([true], "You must accept the terms and conditions"),
});
```

## Using Zod Validation

Zod is a TypeScript-first schema validation library with static type inference.

### Basic Example

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

### Advanced Zod Validation

```ts
const updateProfileSchema = z.object({
  name: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  age: z.number().int().min(18).max(120),
  email: z.string().email(),
  
  // Nested objects
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
    zipCode: z.string().regex(/^\d{5}$/),
  }).optional(),
  
  // Arrays
  skills: z.array(z.string()).min(1).max(10),
  
  // Enums
  role: z.enum(['user', 'admin', 'moderator']),
  
  // Dates
  birthDate: z.string().datetime(),
  
  // Custom validation
  username: z.string().refine(
    (val) => /^[a-zA-Z0-9_]+$/.test(val),
    { message: "Username can only contain letters, numbers, and underscores" }
  ),
});
```

## Creating the ValidatedRequest Helper

To use validation in your project, create a helper file:

```ts
// src/helpers/validation.ts
import * as yup from "yup";
import { z } from "zod";
import { ctx } from "@devbro/pashmak/context";
import { Request, createParamDecorator } from "@devbro/pashmak/router";

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

    // Check if it's a Zod schema
    if ("parse" in schema && typeof schema.parse === "function") {
      return await schema.parseAsync(requestBody);
    }

    // Otherwise, treat it as Yup schema
    return await (schema as yup.ObjectSchema<any>)
      .noUnknown()
      .validate(requestBody, { abortEarly: false });
  });
}
```

## Error Handling

When validation fails, an error is automatically thrown and can be caught by your error handler:

```ts
import { HttpBadRequestError } from "@devbro/pashmak/http";

@Post()
async create(@ValidatedRequest(createUserSchema) data: any) {
  try {
    return await User.create(data);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new HttpBadRequestError(error.message);
    }
    throw error;
  }
}
```

## Validation Best Practices

1. **Define schemas as static properties**: Keep validation schemas with your controllers for better organization
2. **Reuse schemas**: Create common validation schemas in a shared location
3. **Provide clear error messages**: Use custom error messages for better user experience
4. **Validate early**: Use validation to catch errors before they reach your business logic
5. **Type safety**: Leverage TypeScript types with Zod for end-to-end type safety

## Common Validation Patterns

### Optional Fields with Defaults

```ts
const schema = yup.object({
  name: yup.string().required(),
  role: yup.string().default('user'),
  isActive: yup.boolean().default(true),
});
```

### Conditional Validation

```ts
const schema = yup.object({
  accountType: yup.string().oneOf(['personal', 'business']),
  companyName: yup.string().when('accountType', {
    is: 'business',
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.optional(),
  }),
});
```

### Custom Validators

```ts
const schema = yup.object({
  username: yup.string().test(
    'unique-username',
    'Username already exists',
    async (value) => {
      const exists = await User.findOne({ username: value });
      return !exists;
    }
  ),
});
```
