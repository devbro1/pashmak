import { Config } from './Config.mjs';

export type { ConfigKey, ConfigKeys } from './Config.mjs';
export * from './ConfigLoader.mjs';

const config = Config.getInstance();

export * from './types.mjs';
export { Config, config };
