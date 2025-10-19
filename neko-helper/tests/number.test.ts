import { describe, it, expect } from 'vitest';
import { Num } from '../src/index.js';

describe('Number Utilities', () => {
  describe('abbreviate', () => {
    it('should return the number as string for values less than 1000', () => {
      expect(Num.abbreviate(999)).toBe('999');
      expect(Num.abbreviate(500)).toBe('500');
      expect(Num.abbreviate(-999)).toBe('-999');
    });

    it('should abbreviate thousands with K suffix', () => {
      expect(Num.abbreviate(1000)).toBe('1K');
      expect(Num.abbreviate(1500)).toBe('1.5K');
      expect(Num.abbreviate(9999)).toBe('10K');
    });

    it('should abbreviate millions with M suffix', () => {
      expect(Num.abbreviate(1000000)).toBe('1M');
      expect(Num.abbreviate(2500000)).toBe('2.5M');
      expect(Num.abbreviate(10000000)).toBe('10M');
    });

    it('should abbreviate billions with B suffix', () => {
      expect(Num.abbreviate(1000000000)).toBe('1B');
      expect(Num.abbreviate(1500000000)).toBe('1.5B');
    });

    it('should handle negative numbers', () => {
      expect(Num.abbreviate(-1500)).toBe('-1.5K');
      expect(Num.abbreviate(-1000000)).toBe('-1M');
    });
  });

  describe('clamp', () => {
    it('should return the number if within range', () => {
      expect(Num.clamp(5, 1, 10)).toBe(5);
      expect(Num.clamp(7.5, 0, 10)).toBe(7.5);
    });

    it('should return minimum value if number is below range', () => {
      expect(Num.clamp(-5, 1, 10)).toBe(1);
      expect(Num.clamp(0.5, 1, 10)).toBe(1);
    });

    it('should return maximum value if number is above range', () => {
      expect(Num.clamp(15, 1, 10)).toBe(10);
      expect(Num.clamp(100, 1, 10)).toBe(10);
    });

    it('should handle negative ranges', () => {
      expect(Num.clamp(-15, -10, -1)).toBe(-10);
      expect(Num.clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('currencyFormat', () => {
    it('should format USD currency by default', () => {
      expect(Num.currencyFormat(1234.56)).toBe('$1,234.56');
      expect(Num.currencyFormat(1000)).toBe('$1,000.00');
      expect(Num.currencyFormat(0)).toBe('$0.00');
    });

    it('should format different currencies', () => {
      expect(Num.currencyFormat(1234.56, 'EUR')).toMatch(/€1,234.56|1,234.56\s*€/);
      expect(Num.currencyFormat(1000, 'GBP')).toMatch(/£1,000.00|1,000.00\s*£/);
    });

    it('should handle negative amounts', () => {
      expect(Num.currencyFormat(-1234.56)).toMatch(/-?\$1,234.56|\(\$1,234.56\)/);
    });
  });

  describe('fileSize', () => {
    it('should return bytes for small values', () => {
      expect(Num.fileSize(0)).toBe('0 B');
      expect(Num.fileSize(500)).toBe('500 B');
      expect(Num.fileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(Num.fileSize(1024)).toBe('1 KB');
      expect(Num.fileSize(1536)).toBe('1.5 KB');
      expect(Num.fileSize(2048)).toBe('2 KB');
    });

    it('should format megabytes', () => {
      expect(Num.fileSize(1048576)).toBe('1 MB');
      expect(Num.fileSize(1572864)).toBe('1.5 MB');
    });

    it('should format larger units', () => {
      expect(Num.fileSize(1073741824)).toBe('1 GB');
      expect(Num.fileSize(1099511627776)).toBe('1 TB');
    });

    it('should handle negative values', () => {
      expect(Num.fileSize(-1024)).toBe('-1 KB');
    });
  });

  describe('format', () => {
    it('should format numbers with default 2 decimal places', () => {
      expect(Num.format(1234.5678)).toBe('1,234.57');
      expect(Num.format(1000000)).toBe('1,000,000.00');
    });

    it('should format with custom decimal places', () => {
      expect(Num.format(1234.5678, 1)).toBe('1,234.6');
      expect(Num.format(42, 0)).toBe('42');
      expect(Num.format(1234.5678, 3)).toBe('1,234.568');
    });

    it('should handle negative numbers', () => {
      expect(Num.format(-1234.56)).toBe('-1,234.56');
    });
  });

  describe('ordinal', () => {
    it('should handle standard ordinals', () => {
      expect(Num.ordinal(1)).toBe('1st');
      expect(Num.ordinal(2)).toBe('2nd');
      expect(Num.ordinal(3)).toBe('3rd');
      expect(Num.ordinal(4)).toBe('4th');
    });

    it('should handle special cases (11th, 12th, 13th)', () => {
      expect(Num.ordinal(11)).toBe('11th');
      expect(Num.ordinal(12)).toBe('12th');
      expect(Num.ordinal(13)).toBe('13th');
      expect(Num.ordinal(111)).toBe('111th');
      expect(Num.ordinal(112)).toBe('112th');
      expect(Num.ordinal(113)).toBe('113th');
    });

    it('should handle larger numbers', () => {
      expect(Num.ordinal(21)).toBe('21st');
      expect(Num.ordinal(22)).toBe('22nd');
      expect(Num.ordinal(23)).toBe('23rd');
      expect(Num.ordinal(101)).toBe('101st');
      expect(Num.ordinal(102)).toBe('102nd');
      expect(Num.ordinal(103)).toBe('103rd');
    });

    it('should handle negative numbers', () => {
      expect(Num.ordinal(-1)).toBe('-1st');
      expect(Num.ordinal(-2)).toBe('-2nd');
      expect(Num.ordinal(-11)).toBe('-11th');
    });
  });

  describe('parse', () => {
    it('should parse valid number strings', () => {
      expect(Num.parse('123')).toBe(123);
      expect(Num.parse('123.45')).toBe(123.45);
      expect(Num.parse('-42')).toBe(-42);
      expect(Num.parse('0')).toBe(0);
    });

    it('should handle numeric inputs', () => {
      expect(Num.parse(123)).toBe(123);
      expect(Num.parse(0)).toBe(0);
      expect(Num.parse(-42)).toBe(-42);
      expect(Num.parse(123.45)).toBe(123.45);
    });

    it('should parse numbers with thousands separators', () => {
      expect(Num.parse('1,234')).toBe(1234);
      expect(Num.parse('1,234,567')).toBe(1234567);
      expect(Num.parse('1 234')).toBe(1234);
    });

    it('should return undefined for invalid strings', () => {
      expect(Num.parse('not a number')).toBeUndefined();
      expect(Num.parse('abc')).toBeUndefined();
      expect(Num.parse('')).toBeUndefined();
      expect(Num.parse('123abc')).toBeUndefined();
    });

    it('should handle null and undefined inputs', () => {
      expect(Num.parse(null as any)).toBeUndefined();
      expect(Num.parse(undefined)).toBeUndefined();
    });

    it('should handle NaN input', () => {
      expect(Num.parse(NaN)).toBeUndefined();
    });

    it('should properly handle zero values', () => {
      expect(Num.parse('0')).toBe(0);
      expect(Num.parse(0)).toBe(0);
      expect(Num.parse('0.0')).toBe(0);
      expect(Num.parse('00')).toBe(0);
    });
  });

  describe('spell', () => {
    it('should convert numbers to words', () => {
      expect(Num.spell(0)).toBe('zero');
      expect(Num.spell(1)).toBe('one');
      expect(Num.spell(42)).toBe('forty-two');
      expect(Num.spell(100)).toBe('one hundred');
    });

    it('should handle negative numbers', () => {
      expect(Num.spell(-5)).toBe('minus five');
    });

    it('should handle decimal numbers by flooring them', () => {
      expect(Num.spell(42.9)).toBe('forty-two');
      expect(Num.spell(100.1)).toBe('one hundred');
    });
  });

  describe('spellOrdinal', () => {
    it('should convert numbers to ordinal words', () => {
      expect(Num.spellOrdinal(1)).toBe('first');
      expect(Num.spellOrdinal(2)).toBe('second');
      expect(Num.spellOrdinal(3)).toBe('third');
      expect(Num.spellOrdinal(21)).toBe('twenty-first');
    });

    it('should handle larger numbers', () => {
      expect(Num.spellOrdinal(100)).toBe('one hundredth');
    });

    it('should handle negative numbers by taking absolute value', () => {
      expect(Num.spellOrdinal(-1)).toBe('first');
      expect(Num.spellOrdinal(-2)).toBe('second');
    });
  });
});
