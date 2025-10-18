import { toWords, toWordsOrdinal } from 'number-to-words';

/**
 * Abbreviates large numbers with appropriate suffixes (K, M, B, T, etc.).
 *
 * Converts numbers to abbreviated format using standard suffixes:
 * - K for thousands (1,000+)
 * - M for millions (1,000,000+)
 * - B for billions (1,000,000,000+)
 * - T for trillions (1,000,000,000,000+)
 *
 * @param num - The number to abbreviate
 * @returns The abbreviated number string with appropriate suffix
 *
 * @example
 * ```typescript
 * abbreviate(1000) // "1K"
 * abbreviate(1500) // "1.5K"
 * abbreviate(1000000) // "1M"
 * abbreviate(2500000) // "2.5M"
 * abbreviate(999) // "999"
 * ```
 */
export function abbreviate(num: number): string {
  if (Math.abs(num) < 1000) {
    return num.toString();
  }

  const suffixes = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const tier = (Math.log10(Math.abs(num)) / 3) | 0;

  if (tier === 0) return num.toString();

  const suffix = suffixes[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  if (scaled % 1 === 0) {
    return scaled.toString() + suffix;
  } else {
    const fixed = parseFloat(scaled.toFixed(1));
    return (fixed % 1 === 0 ? fixed.toString() : fixed.toFixed(1)) + suffix;
  }
}

/**
 * Clamps a number between minimum and maximum values.
 *
 * Ensures that the input number falls within the specified range.
 * If the number is below the minimum, returns the minimum.
 * If the number is above the maximum, returns the maximum.
 * Otherwise, returns the original number.
 *
 * @param num - The number to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped number within the specified range
 *
 * @example
 * ```typescript
 * clamp(5, 1, 10) // 5
 * clamp(-5, 1, 10) // 1
 * clamp(15, 1, 10) // 10
 * clamp(7.5, 0, 5) // 5
 * ```
 */
export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

/**
 * Formats a number as currency with proper locale formatting.
 *
 * Converts a numeric value to a formatted currency string using
 * the browser's Intl.NumberFormat API. Supports different currencies
 * and uses appropriate locale-specific formatting.
 *
 * @param num - The number to format as currency
 * @param currency - The currency code (ISO 4217) to use for formatting
 * @returns The formatted currency string
 *
 * @example
 * ```typescript
 * currencyFormat(1234.56) // "$1,234.56" (in USD)
 * currencyFormat(1234.56, 'EUR') // "€1,234.56" (in EUR)
 * currencyFormat(1000, 'GBP') // "£1,000.00" (in GBP)
 * currencyFormat(0) // "$0.00"
 * ```
 */
export function currencyFormat(num: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(num);
}

/**
 * Formats a number of bytes into a human-readable file size string.
 *
 * Converts byte values to appropriate units (B, KB, MB, GB, TB, PB, EB, ZB, YB)
 * with proper decimal formatting. Uses binary (1024) units for conversion.
 *
 * @param num - The number of bytes to format
 * @returns The formatted file size string with appropriate unit
 *
 * @example
 * ```typescript
 * fileSize(1024) // "1 KB"
 * fileSize(1536) // "1.5 KB"
 * fileSize(1048576) // "1 MB"
 * fileSize(500) // "500 B"
 * fileSize(0) // "0 B"
 * ```
 */
export function fileSize(num: number): string {
  if (num === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const base = 1024;
  const unitIndex = Math.floor(Math.log(Math.abs(num)) / Math.log(base));
  const size = num / Math.pow(base, unitIndex);

  return `${size % 1 === 0 ? size : size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats a number with specified decimal places and thousands separators.
 *
 * Converts a number to a string with the specified number of decimal places
 * and includes thousands separators for better readability.
 *
 * @param num - The number to format
 * @param decimalPlaces - The number of decimal places to show (default: 2)
 * @returns The formatted number string with separators
 *
 * @example
 * ```typescript
 * format(1234.5678) // "1,234.57"
 * format(1234.5678, 1) // "1,234.6"
 * format(1000000) // "1,000,000.00"
 * format(42, 0) // "42"
 * ```
 */
export function format(num: number, decimalPlaces: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(num);
}

/**
 * Converts a number to its ordinal string representation.
 *
 * Adds the appropriate ordinal suffix (st, nd, rd, th) to a number
 * based on English ordinal number rules.
 *
 * @param num - The number to convert to ordinal form
 * @returns The ordinal string representation of the number
 *
 * @example
 * ```typescript
 * ordinal(1) // "1st"
 * ordinal(2) // "2nd"
 * ordinal(3) // "3rd"
 * ordinal(4) // "4th"
 * ordinal(21) // "21st"
 * ordinal(22) // "22nd"
 * ordinal(23) // "23rd"
 * ordinal(101) // "101st"
 * ```
 */
export function ordinal(num: number): string {
  const absNum = Math.abs(num);
  const lastTwoDigits = absNum % 100;
  const lastDigit = absNum % 10;

  // Special case for 11th, 12th, 13th
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${num}th`;
  }

  // Regular cases
  switch (lastDigit) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
}

/**
 * Parses a string or number to extract a numeric value.
 *
 * Attempts to parse a string representation of a number or return
 * the numeric value if already a number. Returns undefined if the
 * input cannot be parsed to a valid number. Properly handles the
 * case where the input is 0.
 *
 * @param str - The string, number, or undefined to parse as a number
 * @returns The parsed number or undefined if parsing fails
 *
 * @example
 * ```typescript
 * parse("123") // 123
 * parse("123.45") // 123.45
 * parse("-42") // -42
 * parse("1,234") // 1234
 * parse("0") // 0
 * parse(0) // 0
 * parse(42) // 42
 * parse("not a number") // undefined
 * parse("") // undefined
 * parse(undefined) // undefined
 * ```
 */
export function parse(str: string | number | undefined): number | undefined {
  // Handle undefined/null cases
  if (str === undefined || str === null) {
    return undefined;
  }

  // If it's already a number, return it (including 0)
  if (typeof str === 'number') {
    return isNaN(str) ? undefined : str;
  }

  // Handle string cases
  if (typeof str !== 'string') {
    return undefined;
  }

  // Handle empty string
  if (str.trim() === '') {
    return undefined;
  }

  // Remove common thousands separators and whitespace
  const cleaned = str.replace(/[,\s]/g, '');

  // Try to parse the cleaned string
  const parsed = globalThis.Number(cleaned);

  // Return undefined if parsing resulted in NaN, otherwise return the number (including 0)
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Converts a number to its written English word representation.
 *
 * Transforms numeric values into their English word equivalents.
 * Supports integers and handles negative numbers appropriately.
 *
 * @param num - The number to convert to words
 * @returns The written English representation of the number
 *
 * @example
 * ```typescript
 * spell(42) // "forty-two"
 * spell(100) // "one hundred"
 * spell(1001) // "one thousand one"
 * spell(-5) // "minus five"
 * spell(0) // "zero"
 * ```
 */
export function spell(num: number): string {
  return toWords(Math.floor(num));
}

/**
 * Converts a number to its written English ordinal word representation.
 *
 * Transforms numeric values into their English ordinal word equivalents
 * (first, second, third, etc.). Supports positive integers.
 *
 * @param num - The number to convert to ordinal words
 * @returns The written English ordinal representation of the number
 *
 * @example
 * ```typescript
 * spellOrdinal(1) // "first"
 * spellOrdinal(2) // "second"
 * spellOrdinal(3) // "third"
 * spellOrdinal(21) // "twenty-first"
 * spellOrdinal(100) // "one hundredth"
 * ```
 */
export function spellOrdinal(num: number): string {
  return toWordsOrdinal(Math.floor(Math.abs(num)));
}
