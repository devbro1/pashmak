---
sidebar_position: 3
---

# Context

One major feature is context, it allows for separating processes safely without sharing sensetive data between them.

contextualized processes:

- http requests
- cli command
- cron jobs

## creating your own context

```ts
ctx().set("context_key", my_object);

ctx().get < MyObject > get("context_key");
```

It is suggested that you add a wrapper around your context.

```ts
function getMyObject(): MyObject {
  return ctx().getOrThrow < MyObject > get("context_key");
}
```

## Unit testing in a contexualized env

during testing you may want to have your own contextualized test or mini process.

```ts
import { context_provider } from "@devbro/pashmak/context";

test("context test", async () => {
  await context_provider.run(async (): Promise<void> => {
    ctx().get("????");
  });
});
```
