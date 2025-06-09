---
sidebar_position: 2
---

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

## More configurations

There can be multiple features that depends on configurations to run successfully such as database, file, caching, and etc. To make maintaining configurations for each of these features, it is strongly suggested to keep their configurations in separate files and import(`require()`) them into default config. the main configuration for each of these services must be named `default`. for example, if your system is connecting to 3 different databases, the main database must be labelled default, the second and third, can be given any name of your own choosing.

## custom feature configurations

If you decide to create your own custom feature, for example a payment processing, that needs configuration, you can create your own `XYZ.ts` file similar to:

```typescript
// payment.ts
export default {
  provider: 'stripe',
  ....
}

//optional if you are planning to connect to more than one service
export const secondary_payment_system = {
  ?????
}

//default.ts
export default {
  ?????
  payment_system: require('./payment');
};

// somewhere else in your code
import config from 'config';


config.get('payment_system.default');
if(config.get('payment_system.default.provider') === 'stripe') {
  ?????
}
```

## .env AKA dotenv

there is also .env support in case you want to load some configs that way. please note, you will still need to add the specific configs you want to default.js to be able to access the values.
