import { describe, it, expect } from 'vitest';
import { Number } from '../src/index.js';

describe('Number Utilities', () => {
  describe('abbreviate', () => {
    it('should return the number as string for values less than 1000', () => {
      expect(Number.abbreviate(999)).toBe('999');
      expect(Number.abbreviate(500)).toBe('500');
      expect(Number.abbreviate(-999)).toBe('-999');
    });

    it('should abbreviate thousands with K suffix', () => {
      expect(Number.abbreviate(1000)).toBe('1K');
      expect(Number.abbreviate(1500)).toBe('1.5K');
      expect(Number.abbreviate(9999)).toBe('10K');
    });

    it('should abbreviate millions with M suffix', () => {
      expect(Number.abbreviate(1000000)).toBe('1M');
      expect(Number.abbreviate(2500000)).toBe('2.5M');
      expect(Number.abbreviate(10000000)).toBe('10M');
    });

    it('should abbreviate billions with B suffix', () => {
      expect(Number.abbreviate(1000000000)).toBe('1B');
      expect(Number.abbreviate(1500000000)).toBe('1.5B');
    });

    it('should handle negative numbers', () => {
      expect(Number.abbreviate(-1500)).toBe('-1.5K');
      expect(Number.abbreviate(-1000000)).toBe('-1M');
    });
  });

  describe('clamp', () => {
    it('should return the number if within range', () => {
      expect(Number.clamp(5, 1, 10)).toBe(5);
      expect(Number.clamp(7.5, 0, 10)).toBe(7.5);
    });

    it('should return minimum value if number is below range', () => {
      expect(Number.clamp(-5, 1, 10)).toBe(1);
      expect(Number.clamp(0.5, 1, 10)).toBe(1);
    });

    it('should return maximum value if number is above range', () => {
      expect(Number.clamp(15, 1, 10)).toBe(10);
      expect(Number.clamp(100, 1, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(Number.clamp(-15, -10, -1)).toBe(-10);
      expect(Number.clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('currencyFormat', () => {
    it('should format USD currency by default', () => {
      expect(Number.currencyFormat(1234.56)).toBe('$1,234.56');
      expect(Number.currencyFormat(1000)).toBe('$1,000.00');
      expect(Number.currencyFormat(0)).toBe('$0.00');
    });

    it('should format different currencies', () => {
      expect(Number.currencyFormat(1234.56, 'EUR')).toMatch(/€1,234.56|1,234.56\s*€/);
      expect(Number.currencyFormat(1000, 'GBP')).toMatch(/£1,000.00|1,000.00\s*£/);
    });

    it('should handle negative amounts', () => {
      expect(Number.currencyFormat(-1234.56)).toMatch(/-?\$1,234.56|\(\$1,234.56\)/);
    });
  });

  describe('fileSize', () => {
    it('should return bytes for small values', () => {
      expect(Number.fileSize(0)).toBe('0 B');
      expect(Number.fileSize(500)).toBe('500 B');
      expect(Number.fileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(Number.fileSize(1024)).toBe('1 KB');
      expect(Number.fileSize(1536)).toBe('1.5 KB');
      expect(Number.fileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(Number.fileSize(1048576)).toBe('1 MB');
      expect(Number.fileSize(1572864)).toBe('1.5 MB');
    });

    it('should format larger units', () => {
      expect(Number.fileSize(1073741824)).toBe('1 GB');
      expect(Number.fileSize(1099511627776)).toBe('1 TB');
    });

    it('should handle negative values', () => {
      expect(Number.fileSize(-1024)).toBe('-1 KB');
    });
  });

  describe('format', () => {
    it('should format numbers with default 2 decimal places', () => {
      expect(Number.format(1234.5678)).toBe('1,234.57');
      expect(Number.format(1000000)).toBe('1,000,000.00');
    });

    it('should format with custom decimal places', () => {
      expect(Number.format(1234.5678, 1)).toBe('1,234.6');
      expect(Number.format(42, 0)).toBe('42');
      expect(Number.format(1234.5678, 3)).toBe('1,234.568');
    });

    it('should handle negative numbers', () => {
      expect(Number.format(-1234.56)).toBe('-1,234.56');
    });
  });

  describe('ordinal', () => {
    it('should handle standard ordinals', () => {
      expect(Number.ordinal(1)).toBe('1st');
      expect(Number.ordinal(2)).toBe('2nd');
      expect(Number.ordinal(3)).toBe('3rd');
      expect(Number.ordinal(4)).toBe('4th');
    });

    it('should handle special cases (11th, 12th, 13th)', () => {
      expect(Number.ordinal(11)).toBe('11th');
      expect(Number.ordinal(12)).toBe('12th');
      expect(Number.ordinal(13)).toBe('13th');
      expect(Number.ordinal(111)).toBe('111th');
      expect(Number.ordinal(112)).toBe('112th');
      expect(Number.ordinal(113)).toBe('113th');
    });

    it('should handle larger numbers', () => {
      expect(Number.ordinal(21)).toBe('21st');
      expect(Number.ordinal(22)).toBe('22nd');
      expect(Number.ordinal(23)).toBe('23rd');
      expect(Number.ordinal(101)).toBe('101st');
      expect(Number.ordinal(102)).toBe('102nd');
      expect(Number.ordinal(103)).toBe('103rd');
    });

    it('should handle negative numbers', () => {
      expect(Number.ordinal(-1)).toBe('-1st');
      expect(Number.ordinal(-2)).toBe('-2nd');
      expect(Number.ordinal(-11)).toBe('-11th');
    });
  });

  describe('parse', () => {
    it('should parse valid number strings', () => {
      expect(Number.parse('123')).toBe(123);
      expect(Number.parse('123.45')).toBe(123.45);
      expect(Number.parse('-42')).toBe(-42);
      expect(Number.parse('0')).toBe(0);
    });

    it('should handle numeric inputs', () => {
      expect(Number.parse(123)).toBe(123);
      expect(Number.parse(0)).toBe(0);
      expect(Number.parse(-42)).toBe(-42);
      expect(Number.parse(123.45)).toBe(123.45);
    });

    it('should parse numbers with thousands separators', () => {
      expect(Number.parse('1,234')).toBe(1234);
      expect(Number.parse('1,234,567')).toBe(1234567);
      expect(Number.parse('1 234')).toBe(1234);
    });

    it('should return undefined for invalid strings', () => {
      expect(Number.parse('not a number')).toBeUndefined();
      expect(Number.parse('abc')).toBeUndefined();
      expect(Number.parse('')).toBeUndefined();
      expect(Number.parse('123abc')).toBeUndefined();
    });

    it('should handle null and undefined inputs', () => {
      expect(Number.parse(null as any)).toBeUndefined();
      expect(Number.parse(undefined)).toBeUndefined();
    });

    it('should handle NaN input', () => {
      expect(Number.parse(NaN)).toBeUndefined();
    });

    it('should properly handle zero values', () => {
      expect(Number.parse('0')).toBe(0);
      expect(Number.parse(0)).toBe(0);
      expect(Number.parse('0.0')).toBe(0);
      expect(Number.parse('00')).toBe(0);
    });
  });

  describe('spell', () => {
    it('should convert numbers to words', () => {
      expect(Number.spell(0)).toBe('zero');
      expect(Number.spell(1)).toBe('one');
      expect(Number.spell(42)).toBe('forty-two');
      expect(Number.spell(100)).toBe('one hundred');
    });

    it('should handle negative numbers', () => {
      expect(Number.spell(-5)).toBe('minus five');
    });

    it('should handle decimal numbers by flooring them', () => {
      expect(Number.spell(42.9)).toBe('forty-two');
      expect(Number.spell(100.1)).toBe('one hundred');
    });
  });

  describe('spellOrdinal', () => {
    it('should convert numbers to ordinal words', () => {
      expect(Number.spellOrdinal(1)).toBe('first');
      expect(Number.spellOrdinal(2)).toBe('second');
      expect(Number.spellOrdinal(3)).toBe('third');
      expect(Number.spellOrdinal(21)).toBe('twenty-first');
    });

    it('should handle larger numbers', () => {
      expect(Number.spellOrdinal(100)).toBe('one hundredth');
    });

    it('should handle negative numbers by taking absolute value', () => {
      expect(Number.spellOrdinal(-1)).toBe('first');
      expect(Number.spellOrdinal(-2)).toBe('second');
    });
  });
});
