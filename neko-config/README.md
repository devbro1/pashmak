# @devbro/neko-config

Part of neko and pashmak ecosystem, it is a super simple library to manage configs in your projects easily.

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
