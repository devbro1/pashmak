import jwtLib from 'jsonwebtoken';
import type { Secret, SignOptions, VerifyOptions, DecodeOptions, JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import * as ed from '@noble/ed25519';
import { md5 as nobleMd5, sha1 as nobleSha1 } from '@noble/hashes/legacy.js';
import { sha256 as nobleSha256, sha512 as nobleSha512 } from '@noble/hashes/sha2.js';
import { sha3_256 as nobleSha3_256, sha3_512 as nobleSha3_512 } from '@noble/hashes/sha3.js';
import {
  isBcryptHash as cryptoIsBcryptHash,
  encryptPassword as cryptoEncryptPassword,
  compareBcrypt,
} from './crypto.mjs';

// Setup ed25519 hashing function
ed.hashes.sha512 = nobleSha512;
ed.hashes.sha512Async = (m: Uint8Array) => Promise.resolve(nobleSha512(m));

/**
 * Hash utilities for common cryptographic hashing algorithms
 */
export namespace hash {
  /**
   * Generates an MD5 hash of the input string
   *
   * @param data - The string to hash
   * @returns The MD5 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.md5('hello world')
   * // Returns: '5eb63bbbe01eeed093cb22bb8f5acdc3'
   * ```
   */
  export function md5(data: string): string {
    const hash = nobleMd5(Buffer.from(data, 'utf8'));
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Generates a SHA-1 hash of the input string
   *
   * @param data - The string to hash
   * @returns The SHA-1 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.sha1('hello world')
   * // Returns: '2aae6c35c94fcfb415dbe95f408b9ce91ee846ed'
   * ```
   */
  export function sha1(data: string): string {
    const hash = nobleSha1(Buffer.from(data, 'utf8'));
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Generates a SHA-256 hash of the input string
   *
   * @param data - The string to hash
   * @returns The SHA-256 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.sha256('hello world')
   * // Returns: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
   * ```
   */
  export function sha256(data: string): string {
    const hash = nobleSha256(Buffer.from(data, 'utf8'));
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Generates a SHA-512 hash of the input string
   *
   * @param data - The string to hash
   * @returns The SHA-512 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.sha512('hello world')
   * // Returns: '309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f'
   * ```
   */
  export function sha512(data: string): string {
    const hash = nobleSha512(Buffer.from(data, 'utf8'));
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Generates a SHA3-256 hash of the input string
   *
   * @param data - The string to hash
   * @returns The SHA3-256 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.sha3_256('hello world')
   * // Returns: '644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938'
   * ```
   */
  export function sha3_256(data: string): string {
    const hashResult = nobleSha3_256(Buffer.from(data, 'utf8'));
    return Buffer.from(hashResult).toString('hex');
  }

  /**
   * Generates a SHA3-512 hash of the input string
   *
   * @param data - The string to hash
   * @returns The SHA3-512 hash as a hexadecimal string
   *
   * @example
   * ```typescript
   * hash.sha3_512('hello world')
   * // Returns: '840006653e9ac9e95117a15c915caab81662918e925de9e004f774ff82d7079a40d4d27b1b372657c61d46d470304c88c788b3a4527ad074d1dccbee5dbaa99a'
   * ```
   */
  export function sha3_512(data: string): string {
    const hashResult = nobleSha3_512(Buffer.from(data, 'utf8'));
    return Buffer.from(hashResult).toString('hex');
  }
}

/**
 * Password hashing and comparison utilities using bcrypt
 */
export namespace password {
  /**
   * Checks if a string is a valid bcrypt hash
   *
   * @param str - The string to check
   * @returns True if the string is a valid bcrypt hash, false otherwise
   *
   * @example
   * ```typescript
   * password.isBcryptHash('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
   * // Returns: true
   *
   * password.isBcryptHash('not a hash')
   * // Returns: false
   * ```
   */
  export function isBcryptHash(str: string): boolean {
    return cryptoIsBcryptHash(str);
  }

  /**
   * Encrypts a password using bcrypt
   *
   * @param password - The plain text password to encrypt
   * @param rounds - The number of rounds to use for salt generation (default: 10)
   * @returns A promise that resolves to the encrypted password hash
   *
   * @example
   * ```typescript
   * await password.encryptPassword('mySecurePassword')
   * // Returns: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
   * ```
   */
  export async function encryptPassword(password: string, rounds: number = 10): Promise<string> {
    // For custom rounds, we need to generate salt and hash manually
    if (rounds !== 10) {
      const bcrypt = (await import('bcryptjs')).default;
      const salt = await bcrypt.genSalt(rounds);
      return await bcrypt.hash(password, salt);
    }
    // Use existing crypto function for default rounds
    return cryptoEncryptPassword(password);
  }

  /**
   * Compares a plain text password with a bcrypt hash
   *
   * @param password - The plain text password to compare
   * @param hash - The bcrypt hash to compare against
   * @returns A promise that resolves to true if the password matches the hash, false otherwise
   *
   * @example
   * ```typescript
   * await password.comparePassword('myPassword', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
   * // Returns: true or false
   * ```
   */
  export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return compareBcrypt(password, hash);
  }
}

/**
 * Cryptographic key generation utilities
 */
export namespace keys {
  /**
   * Generates an RSA key pair
   *
   * @param modulusLength - The modulus length in bits (default: 2048)
   * @returns An object containing the public and private keys in PEM format
   *
   * @example
   * ```typescript
   * const { publicKey, privateKey } = keys.rsa()
   * // Returns: { publicKey: '-----BEGIN PUBLIC KEY-----...', privateKey: '-----BEGIN PRIVATE KEY-----...' }
   * ```
   */
  export function rsa(modulusLength: number = 2048): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    return { publicKey, privateKey };
  }

  /**
   * Generates an Ed25519 key pair
   *
   * @returns A promise that resolves to an object containing the public and private keys as hex strings
   *
   * @example
   * ```typescript
   * const { publicKey, privateKey } = await keys.ed25519()
   * // Returns: { publicKey: '1a2b3c...', privateKey: '9f8e7d...' }
   * ```
   */
  export async function ed25519(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await ed.keygenAsync();
    return {
      publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
      privateKey: Buffer.from(keyPair.secretKey).toString('hex'),
    };
  }
}

/**
 * JSON Web Token (JWT) utilities
 */
export namespace jwt {
  /**
   * Signs a JWT with the provided payload and secret
   *
   * @param payload - The payload to encode in the JWT
   * @param secret - The secret key to sign the JWT with
   * @param options - Optional JWT sign options (algorithm, expiresIn, etc.)
   * @returns The signed JWT token
   *
   * @example
   * ```typescript
   * const token = Enc.jwt.sign({ userId: 123 }, 'mySecret', { expiresIn: '1h' })
   * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   * ```
   */
  export function sign(
    payload: string | object | Buffer,
    secret: Secret,
    options?: SignOptions
  ): string {
    return jwtLib.sign(payload, secret, options);
  }

  /**
   * Verifies a JWT token
   *
   * @param token - The JWT token to verify
   * @param secret - The secret key to verify the JWT with
   * @param options - Optional JWT verify options
   * @returns The decoded payload if verification succeeds
   * @throws Will throw an error if verification fails
   *
   * @example
   * ```typescript
   * try {
   *   const payload = Enc.jwt.verify(token, 'mySecret')
   *   console.log(payload) // { userId: 123, iat: 1234567890, exp: 1234571490 }
   * } catch (err) {
   *   console.error('Invalid token')
   * }
   * ```
   */
  export function verify(
    token: string,
    secret: Secret,
    options?: VerifyOptions
  ): string | JwtPayload {
    return jwtLib.verify(token, secret, options);
  }

  /**
   * Decodes a JWT token without verifying its signature
   *
   * @param token - The JWT token to decode
   * @param options - Optional decode options
   * @returns The decoded payload or null if the token is invalid
   *
   * @example
   * ```typescript
   * const payload = Enc.jwt.decode(token)
   * // Returns: { userId: 123, iat: 1234567890, exp: 1234571490 }
   * ```
   */
  export function decode(token: string, options?: DecodeOptions): null | string | JwtPayload {
    return jwtLib.decode(token, options);
  }
}

/**
 * Digital signature utilities
 */
export namespace sign {
  /**
   * Signs data using Ed25519 private key
   *
   * @param privateKey - The Ed25519 private key as a hex string
   * @param data - The data to sign
   * @returns A promise that resolves to the signature as a hex string
   *
   * @example
   * ```typescript
   * const { privateKey } = await keys.ed25519()
   * const signature = await sign.ed25519(privateKey, 'message to sign')
   * // Returns: 'a1b2c3d4...'
   * ```
   */
  export async function ed25519(privateKey: string, data: string): Promise<string> {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const messageBytes = Buffer.from(data, 'utf8');
    const signature = await ed.sign(messageBytes, privateKeyBytes);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verifies an Ed25519 signature
   *
   * @param publicKey - The Ed25519 public key as a hex string
   * @param signature - The signature to verify as a hex string
   * @param data - The original data that was signed
   * @returns A promise that resolves to true if the signature is valid, false otherwise
   *
   * @example
   * ```typescript
   * const isValid = await sign.verifyEd25519(publicKey, signature, 'message to sign')
   * // Returns: true or false
   * ```
   */
  export async function verifyEd25519(
    publicKey: string,
    signature: string,
    data: string
  ): Promise<boolean> {
    const publicKeyBytes = Buffer.from(publicKey, 'hex');
    const signatureBytes = Buffer.from(signature, 'hex');
    const messageBytes = Buffer.from(data, 'utf8');
    return await ed.verify(signatureBytes, messageBytes, publicKeyBytes);
  }
}
