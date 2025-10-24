import { describe, it, expect } from 'vitest';
import { Enc } from '@/index';

describe('Enc Utilities', () => {
  describe('hash', () => {
    describe('md5', () => {
      it('should generate MD5 hash of a string', () => {
        expect(Enc.hash.md5('hello world')).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3');
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.md5('test1');
        const hash2 = Enc.hash.md5('test2');
        expect(hash1).not.toBe(hash2);
      });

      it('should generate consistent hash for same input', () => {
        const hash1 = Enc.hash.md5('consistent');
        const hash2 = Enc.hash.md5('consistent');
        expect(hash1).toBe(hash2);
      });
    });

    describe('sha1', () => {
      it('should generate SHA-1 hash of a string', () => {
        expect(Enc.hash.sha1('hello world')).toBe('2aae6c35c94fcfb415dbe95f408b9ce91ee846ed');
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.sha1('test1');
        const hash2 = Enc.hash.sha1('test2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('sha256', () => {
      it('should generate SHA-256 hash of a string', () => {
        expect(Enc.hash.sha256('hello world')).toBe(
          'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
        );
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.sha256('test1');
        const hash2 = Enc.hash.sha256('test2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('sha512', () => {
      it('should generate SHA-512 hash of a string', () => {
        expect(Enc.hash.sha512('hello world')).toBe(
          '309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f'
        );
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.sha512('test1');
        const hash2 = Enc.hash.sha512('test2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('sha3_256', () => {
      it('should generate SHA3-256 hash of a string', () => {
        expect(Enc.hash.sha3_256('hello world')).toBe(
          '644bcc7e564373040999aac89e7622f3ca71fba1d972fd94a31c3bfbf24e3938'
        );
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.sha3_256('test1');
        const hash2 = Enc.hash.sha3_256('test2');
        expect(hash1).not.toBe(hash2);
      });
    });

    describe('sha3_512', () => {
      it('should generate SHA3-512 hash of a string', () => {
        expect(Enc.hash.sha3_512('hello world')).toBe(
          '840006653e9ac9e95117a15c915caab81662918e925de9e004f774ff82d7079a40d4d27b1b372657c61d46d470304c88c788b3a4527ad074d1dccbee5dbaa99a'
        );
      });

      it('should generate different hashes for different inputs', () => {
        const hash1 = Enc.hash.sha3_512('test1');
        const hash2 = Enc.hash.sha3_512('test2');
        expect(hash1).not.toBe(hash2);
      });
    });
  });

  describe('password', () => {
    describe('isBcryptHash', () => {
      it('should return true for valid bcrypt hash', () => {
        const validHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        expect(Enc.password.isBcryptHash(validHash)).toBe(true);
      });

      it('should return false for invalid bcrypt hash', () => {
        expect(Enc.password.isBcryptHash('not a hash')).toBe(false);
        expect(Enc.password.isBcryptHash('$2a$10$invalid')).toBe(false);
        expect(Enc.password.isBcryptHash('')).toBe(false);
      });

      it('should support different bcrypt versions', () => {
        const hash2a = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        const hash2b = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        const hash2y = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

        expect(Enc.password.isBcryptHash(hash2a)).toBe(true);
        expect(Enc.password.isBcryptHash(hash2b)).toBe(true);
        expect(Enc.password.isBcryptHash(hash2y)).toBe(true);
      });
    });

    describe('encryptPassword', () => {
      it('should encrypt a password', async () => {
        const password = 'mySecurePassword123';
        const hash = await Enc.password.encryptPassword(password);

        expect(hash).toBeDefined();
        expect(typeof hash).toBe('string');
        expect(Enc.password.isBcryptHash(hash)).toBe(true);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'testPassword';
        const hash1 = await Enc.password.encryptPassword(password);
        const hash2 = await Enc.password.encryptPassword(password);

        expect(hash1).not.toBe(hash2);
      });

      it('should support custom rounds', async () => {
        const password = 'testPassword';
        const hash = await Enc.password.encryptPassword(password, 5);

        expect(hash).toBeDefined();
        expect(Enc.password.isBcryptHash(hash)).toBe(true);
      });
    });

    describe('comparePassword', () => {
      it('should return true for matching password and hash', async () => {
        const password = 'myPassword123';
        const hash = await Enc.password.encryptPassword(password);
        const isMatch = await Enc.password.comparePassword(password, hash);

        expect(isMatch).toBe(true);
      });

      it('should return false for non-matching password', async () => {
        const password = 'myPassword123';
        const wrongPassword = 'wrongPassword';
        const hash = await Enc.password.encryptPassword(password);
        const isMatch = await Enc.password.comparePassword(wrongPassword, hash);

        expect(isMatch).toBe(false);
      });
    });
  });

  describe('keys', () => {
    describe('rsa', () => {
      it('should generate RSA key pair', () => {
        const { publicKey, privateKey } = Enc.keys.rsa();

        expect(publicKey).toBeDefined();
        expect(privateKey).toBeDefined();
        expect(typeof publicKey).toBe('string');
        expect(typeof privateKey).toBe('string');
        expect(publicKey).toContain('BEGIN PUBLIC KEY');
        expect(privateKey).toContain('BEGIN PRIVATE KEY');
      });

      it('should generate different key pairs', () => {
        const keys1 = Enc.keys.rsa();
        const keys2 = Enc.keys.rsa();

        expect(keys1.publicKey).not.toBe(keys2.publicKey);
        expect(keys1.privateKey).not.toBe(keys2.privateKey);
      });

      it('should support custom modulus length', () => {
        const { publicKey, privateKey } = Enc.keys.rsa(4096);

        expect(publicKey).toBeDefined();
        expect(privateKey).toBeDefined();
      });
    });

    describe('ed25519', () => {
      it('should generate Ed25519 key pair', async () => {
        const { publicKey, privateKey } = await Enc.keys.ed25519();

        expect(publicKey).toBeDefined();
        expect(privateKey).toBeDefined();
        expect(typeof publicKey).toBe('string');
        expect(typeof privateKey).toBe('string');
        expect(publicKey.length).toBe(64); // 32 bytes in hex
        expect(privateKey.length).toBe(64); // 32 bytes in hex
      });

      it('should generate different key pairs', async () => {
        const keys1 = await Enc.keys.ed25519();
        const keys2 = await Enc.keys.ed25519();

        expect(keys1.publicKey).not.toBe(keys2.publicKey);
        expect(keys1.privateKey).not.toBe(keys2.privateKey);
      });
    });
  });

  describe('jwt', () => {
    const secret = 'myTestSecret';

    describe('sign', () => {
      it('should sign a JWT token', () => {
        const payload = { userId: 123, username: 'testuser' };
        const token = Enc.jwt.sign(payload, secret);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
      });

      it('should support expiration', () => {
        const payload = { userId: 123 };
        const token = Enc.jwt.sign(payload, secret, { expiresIn: '1h' });

        expect(token).toBeDefined();
      });

      it('should support different algorithms', () => {
        const payload = { userId: 123 };
        const token = Enc.jwt.sign(payload, secret, { algorithm: 'HS256' });

        expect(token).toBeDefined();
      });
    });

    describe('verify', () => {
      it('should verify a valid JWT token', () => {
        const payload = { userId: 123, username: 'testuser' };
        const token = Enc.jwt.sign(payload, secret);
        const decoded = Enc.jwt.verify(token, secret);

        expect(decoded).toBeDefined();
        expect(typeof decoded).toBe('object');
        if (typeof decoded === 'object' && decoded !== null) {
          expect((decoded as any).userId).toBe(123);
          expect((decoded as any).username).toBe('testuser');
        }
      });

      it('should throw error for invalid token', () => {
        expect(() => {
          Enc.jwt.verify('invalid.token.here', secret);
        }).toThrow();
      });

      it('should throw error for wrong secret', () => {
        const payload = { userId: 123 };
        const token = Enc.jwt.sign(payload, secret);

        expect(() => {
          Enc.jwt.verify(token, 'wrongSecret');
        }).toThrow();
      });
    });

    describe('decode', () => {
      it('should decode a JWT token without verification', () => {
        const payload = { userId: 123, username: 'testuser' };
        const token = Enc.jwt.sign(payload, secret);
        const decoded = Enc.jwt.decode(token);

        expect(decoded).toBeDefined();
        if (typeof decoded === 'object' && decoded !== null) {
          expect((decoded as any).userId).toBe(123);
          expect((decoded as any).username).toBe('testuser');
        }
      });

      it('should return null for invalid token', () => {
        const decoded = Enc.jwt.decode('invalid');

        expect(decoded).toBeNull();
      });

      it('should decode token even with wrong secret', () => {
        const payload = { userId: 123 };
        const token = Enc.jwt.sign(payload, secret);
        const decoded = Enc.jwt.decode(token);

        expect(decoded).toBeDefined();
      });
    });
  });

  describe('sign', () => {
    describe('ed25519', () => {
      it('should sign data with Ed25519', async () => {
        const { publicKey, privateKey } = await Enc.keys.ed25519();
        const data = 'message to sign';
        const signature = await Enc.sign.ed25519(privateKey, data);

        expect(signature).toBeDefined();
        expect(typeof signature).toBe('string');
        expect(signature.length).toBe(128); // 64 bytes in hex
      });

      it('should generate different signatures for different data', async () => {
        const { privateKey } = await Enc.keys.ed25519();
        const signature1 = await Enc.sign.ed25519(privateKey, 'data1');
        const signature2 = await Enc.sign.ed25519(privateKey, 'data2');

        expect(signature1).not.toBe(signature2);
      });

      it('should generate consistent signatures for same data', async () => {
        const { privateKey } = await Enc.keys.ed25519();
        const data = 'consistent data';
        const signature1 = await Enc.sign.ed25519(privateKey, data);
        const signature2 = await Enc.sign.ed25519(privateKey, data);

        expect(signature1).toBe(signature2);
      });
    });

    describe('verifyEd25519', () => {
      it('should verify a valid Ed25519 signature', async () => {
        const { publicKey, privateKey } = await Enc.keys.ed25519();
        const data = 'message to sign';
        const signature = await Enc.sign.ed25519(privateKey, data);

        const isValid = await Enc.sign.verifyEd25519(publicKey, signature, data);

        expect(isValid).toBe(true);
      });

      it('should return false for invalid signature', async () => {
        const { publicKey, privateKey } = await Enc.keys.ed25519();
        const data = 'message to sign';
        const signature = await Enc.sign.ed25519(privateKey, data);

        const invalidSignature = 'a'.repeat(128);
        const isValid = await Enc.sign.verifyEd25519(publicKey, invalidSignature, data);

        expect(isValid).toBe(false);
      });

      it('should return false for different data', async () => {
        const { publicKey, privateKey } = await Enc.keys.ed25519();
        const data = 'original data';
        const signature = await Enc.sign.ed25519(privateKey, data);

        const isValid = await Enc.sign.verifyEd25519(publicKey, signature, 'different data');

        expect(isValid).toBe(false);
      });

      it('should return false for wrong public key', async () => {
        const keys1 = await Enc.keys.ed25519();
        const keys2 = await Enc.keys.ed25519();
        const data = 'message to sign';
        const signature = await Enc.sign.ed25519(keys1.privateKey, data);

        const isValid = await Enc.sign.verifyEd25519(keys2.publicKey, signature, data);

        expect(isValid).toBe(false);
      });
    });
  });
});
