# @devbro/neko-context

think react context but for backend. If you need to run multiple threads without sharing memory, this is the way to go.

```ts
import { ctx, ctxsafe, context_provider } from '@devbro/neko-context';

class Animal {
  constructor(public name: string) {}
}

function groom(): void {
  const animal = ctx().get<Animal>('animal');
  console.log(`Grooming ${animal.name}`);
  ctx().set('end_groom_time', Date.now());
}

function feed(): void {
  const animal = ctx().get<Animal>('animal');
  console.log(`Feeding ${animal.name}`);
}

function play(): void {
  const animal = ctxsafe().get<Animal>('animal');
  console.log(`Playing with ${animal?.name}`);
}

const animals = [
  new Animal('Cat'),
  new Animal('Dog'),
  new Animal('Tiger'),
  new Animal('Lion'),
  new Animal('Elephant'),
];

for (const animal of animals) {
  await context_provider.run(async (): Promise<void> => {
    ctx().set('animal', animal);
    ctx().set('start_time', Date.now());
    groom();
    feed();
    play();
    console.log('end of groom time was', ctx().get<Date>('end_groom_time'));
  });
}
```

## ctx() vs ctxsafe()

- `ctx()`: This is the main context that you can use to store and retrieve values. It is unsafe to use it outside of context_provider. If you do, it will throw an error saying you are accessing context outside of a provider.
- `ctxsafe()`: This is a safe version of ctx(). If you call it outside of a context_provider, it will return `undefined` instead of a context.

## Q&A

**Q: Your code acts differently before and after compile.**

A: This is a ESM and CJS compiled library. if you are using ESM, you need to import it as `import { ctx } from "@devbro/pashmak/neko-context";`. If you are using CJS, you need to import it as `const { ctx } = require("@devbro/pashmak/neko-context");`. If you are using both, you need to use the ESM version. Each version acts as independent context. in short, you cannot mix context between ESM and CJS. If you do, you will get unexpected results, in the form of adding something to ctx().set('key', ???) but it comes as undefined when you try ctx().get('key').

**Q: I updated some of my packages, now ctx().get() returns undefined.**

A: This is a common issue when you update your packages. The most likely cause is that you are using a different version of the library that has a different context. Make sure you are using the same version of the library in all your packages. Check your lock file (package-lock.json or yarn.lock) to see if there are multiple versions of the library installed. If there are, you need to make sure all your packages are using the same version of the library.

**Q: Why do I need to use context_provider.run()?**

A: The context_provider.run() is used to create a new context for the code that runs inside it. This is useful when you want to run multiple threads without sharing memory. It allows you to create a new context for each thread and store values in it. If you don't use it, the ctx() will throw an error saying you are accessing context outside of a provider.

**Q: Can I use ctx() outside of context_provider?**

A: No, you cannot use ctx() outside of context_provider. If you do, it will throw an error saying you are accessing context outside of a provider. You can use ctxsafe() outside of context_provider, but it will return undefined if there is no context available.

**Q: Can I use it in a web browser?**

A: No, this is a Node.js library and it is not designed to be used in a web browser. It is meant to be used in a Node.js environment where you can run multiple threads without sharing memory.

## License

MIT

## Need help?

You can submit your issues at https://github.com/devbro1/pashmak
please be specific about your problem/suggestion and provide a reproducible example if possible.
