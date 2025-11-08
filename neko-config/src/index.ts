import { Config } from './Config.mjs';
export * from './ConfigLoader.mjs';
const config = Config.getInstance();
export { Config, config };
