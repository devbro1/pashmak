export * as Arr from './array.mjs';
export * from './crypto.mjs';
export * as Enc from './enc.mjs';
export * from './eventEmitter.mjs';
export * from './FlexibleFactory.mjs';
export * as Num from './number.mjs';
export * from './patternEnforcer.mjs';
export * from './time.mjs';
export * from './types.mjs';

export function getEnv(key: string, ...defaultValue: string[]): string | undefined {
  const rc = process.env[key] ?? defaultValue[0];

  if (rc === undefined && defaultValue.length === 0) {
    throw new Error(
      `process.env.${key} is not defined. either enter value or define a default value`
    );
  }

  return rc;
}
