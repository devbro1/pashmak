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

## creating your own context

```ts
import { ctx } from "@devbro/pashmak/context";

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

If you ever get an error that context has not started it means you are trying to access context outside of a context provider run block. Just wrap your code in `context_provider.run(???)`
