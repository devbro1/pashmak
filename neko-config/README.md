# @devbro/neko-config

Part of neko and pashmak ecosystem, it is a super simple library to manage configs in your projects easily.

## Basic Usage

```ts
// loader.ts
import { config } from '@devbro/neko-config';

config.load(json_data_from_file);

// main_code.ts
import { config, Config } from '@devbro/neko-config';

// get a value with a default value
config.get('PORT', 3000);

// get a value. if it does not exists we get undefined
config.get('security_key');
config.get('databases.primary.uri');
config.get('cache.redis[2].uri');

//check if a given key exists
config.has('PORT');

//get the entire json config
config.all();
```

## Typed Configuration Keys

You can define typed configuration keys using TypeScript module augmentation. This provides type safety and autocomplete for your configuration keys.

```ts
// types/config.d.ts
declare module '@devbro/neko-config' {
  interface ConfigKeys {
    '$.app.name': string;
    '$.app.port': number;
    '$.app.debug': boolean;
    '$.database.host': string;
    '$.database.port': number;
    '$.database.username': string;
    '$.database.password': string;
  }
}
```

After defining your typed keys, TypeScript will provide autocomplete and type checking:

```ts
import { config } from '@devbro/neko-config';

// TypeScript knows this is a string
const appName = config.get('$.app.name');

// TypeScript knows this is a number
const port = config.get('$.app.port');

// TypeScript will show an error if you use a key that's not defined
// const invalid = config.get('$.app.invalid'); // Error!

// You can still use any string key by casting to 'any' if needed
const dynamicKey = config.get('$.some.dynamic.path' as any);
```

**Note**: If you don't augment the `ConfigKeys` interface, all string keys are accepted (default behavior).

## Multiple Config Instances

`config` (lower case c) is a singleton instance of config that can be used anywhere.
If you want to have multiple instances of Config, you can follow:

```ts
// upper case C
import { config, Config } from '@devbro/neko-config';

const c1 = new Config();
c1.load(first_set_of_configs);

const c2 = new Config();
c2.load(second_set_of_configs);
```
