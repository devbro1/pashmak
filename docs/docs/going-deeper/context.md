---
sidebar_position: 1
---

# Context

One major feature in Pashmak is context. It allows for separating processes safely without sharing sensitive data between them. It also leaves flexibility to share resources among different processes.

contextualized processes:

- http requests
- cli command
- cron jobs
- queue jobs

## Working with Context

```ts
import { ctx } from "@devbro/pashmak/context";

ctx().set("context_key", my_object);

let my_var: MyObject = ctx().get < MyObject > get("context_key");
```

Context is not type aware so the best approach would be to add methods around your context calls.

```ts
function getMyObject(): MyObject {
  return ctx().getOrThrow < MyObject > get("context_key");
}
```

### Available methods

- `ctx().set(key: string | string[], value: any): void` - sets a value in the current context
- `ctx().get<T>(key: string | string[]): T | undefined` - gets a value from the current context
- `ctx().getOrThrow<T>(key: string | string[]): T` - gets a value from the current context or throws an error if not found
- `ctx().has(key: string | string[]): boolean` - checks if a key exists in the current context
- `ctx().delete(key: string | string[]): void` - deletes a key from the current context
- `ctx().keys(): string[]` - returns all keys in the current context
- `ctx.isActive(): boolean` - checks if there is an active context

## ctx() vs ctxSafe()

Calling `ctx()` when there is no active context will throw an error. If you want to avoid that you can use `ctxSafe()` which will return a no-op context in such cases.

```ts
import { ctxSafe } from "@devbro/pashmak/context";
const myVar = ctxSafe().get("maybe_missing_key");
```

## Testing in a contexualized env

Tests do not run in a contextualized environment by default. During testing you may want to have your own contextualized test or mini process.

```ts
import { context_provider } from "@devbro/pashmak/context";

test("context test", async () => {
  await context_provider.run(async (): Promise<void> => {
    ctx().get("????");
  });

  // make http calls

  await context_provider.run(async (): Promise<void> => {
    ctx().get("????");
  });
});
```

If you ever get an error that `Context has not started` it means you are trying to access context outside of a context provider run block. Just wrap your code in `context_provider.run(async () => { /* YOUR CODE */ });`

### Http context

Http requests are automatically contextualized by Pashmak. Available contexts in http requests:

- request: incmoming http request object
- response: outgoing http response object
- requestId: unique identifier for the request
