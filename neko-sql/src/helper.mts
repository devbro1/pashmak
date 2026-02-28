import { createRequire } from 'module';

// When bundled to CJS, tsup will handle import.meta.url appropriately
const req = createRequire(import.meta.url);

export function loadPackage(name: string) {
  try {
    return req(name);
  } catch (error: any) {
    // @ts-ignore
    if (Error.isError(error) && error.code === 'MODULE_NOT_FOUND') {
      error.message = `Package "${name}" is not installed. Please install proper db driver to use this database connection.`;
    }

    throw error;
  }
}
