# Configuration

Under the hood, we are using [config](https://www.npmjs.com/package/config) library to help with managing configuration.

To start place your related configs in `config/default.ts` file and it will be autoloaded.

```typescript
import config from "config";

console.log(config.get("databases"));
```

one major behavior is that if you request a config that is not defined, it will throw an error. It is by design to make sure there is no typo and all configs are defined correctly.

it may become needed to load some values from envvars. to do this, use this approach:

```javascript
// config/default.ts
export default {
  port: process.env.PORT || 3000,
};
```

## .env AKA dotenv

there is also .env support in case you want to load some configs that way. please note, you will still need to add the specific configs you want to default.js to be able to access the values.
