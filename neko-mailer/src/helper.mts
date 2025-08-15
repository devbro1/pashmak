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
      let result = prepareEmails(email);
      rc = rc.concat(result);
    }
  }

  return rc;
}
