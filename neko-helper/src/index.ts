export * from './context';
export * from './patternEnforcer';
export * from './time';

export function getEnv(key: string, ...defaultValue: any[]) {
  let rc = process.env[key] ?? defaultValue[0];

  if (rc === undefined && defaultValue.length === 0) {
    throw new Error(
      `process.env.${key} is not defined. either enter value or define a default value`
    );
  }

  return rc;
}
