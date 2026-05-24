import { createRequire } from "module";

// When bundled to CJS, tsup will handle import.meta.url appropriately
const req = createRequire(import.meta.url);

export function loadPackage(name: string) {
  try {
    return req(name);
  } catch (error: any) {
    // @ts-expect-error
    if (Error.isError(error) && error.code === "MODULE_NOT_FOUND") {
      error.message = `Package "${name}" is not installed. Please install the proper mailer provider package to use this provider.`;
    }

    throw error;
  }
}

/**
 * Prepares email addresses by normalizing and filtering them.
 * @param emails The email addresses to prepare.
 * @returns An array of prepared email addresses.
 */
export function prepareEmails(emails: string | string[] | undefined): string[] {
  let rc: string[] = [];
  if (typeof emails === "string") {
    rc = emails
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  } else if (Array.isArray(emails)) {
    for (const email of emails) {
      const result = prepareEmails(email);
      rc = rc.concat(result);
    }
  }

  return rc;
}
