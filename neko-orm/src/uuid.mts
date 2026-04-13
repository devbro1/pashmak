import { randomBytes, randomUUID } from 'crypto';

/**
 * UUID type alias for string-based UUID values.
 */
export type UUID = string;

/**
 * Generates a UUID v7 (time-ordered, monotonically increasing).
 *
 * UUID v7 structure:
 * - 48 bits: Unix timestamp in milliseconds
 * - 4 bits: version = 0x7
 * - 12 bits: random data
 * - 2 bits: variant = 0b10
 * - 62 bits: random data
 *
 * @returns A UUID v7 string
 */
export function generateUUIDv7(): UUID {
  const timestamp = BigInt(Date.now());
  const timeHex = timestamp.toString(16).padStart(12, '0').slice(-12);

  const buf = randomBytes(10);
  const randomHex = buf.toString('hex');

  const part1 = timeHex.slice(0, 8);
  const part2 = timeHex.slice(8, 12);
  const part3 = '7' + randomHex.slice(0, 3);
  const variantByte = (parseInt(randomHex.slice(3, 5), 16) & 0x3f) | 0x80;
  const part4 = variantByte.toString(16).padStart(2, '0') + randomHex.slice(5, 7);
  const part5 = randomHex.slice(7, 19);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Generates a UUID v4 (random).
 * Uses Node.js built-in crypto.randomUUID().
 *
 * @returns A UUID v4 string
 */
export function generateUUIDv4(): UUID {
  return randomUUID();
}

/**
 * Generates a UUID. Defaults to UUID v7 (time-ordered).
 *
 * @returns A UUID string
 */
export function generateUUID(): UUID {
  return generateUUIDv7();
}
