import { createRequire } from 'module';

// When bundled to CJS, tsup will handle import.meta.url appropriately
const req = createRequire(import.meta.url);

export function loadPackage(name: string) {
  try {
    return req(name);
  } catch {
    throw new Error(
      `${name} is not installed. Please follow documentation to install required packages.`
    );
  }
}
