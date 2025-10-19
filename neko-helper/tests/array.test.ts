import { describe, it, expect } from 'vitest';
import { Arr } from '@/index';

describe('Array Utilities', () => {
  describe('intersperse', () => {
    it('should intersperse separator between elements', () => {
      expect(Arr.intersperse([1, 2, 3], 0)).toEqual([1, 0, 2, 0, 3]);
      expect(Arr.intersperse(['a', 'b', 'c'], '-')).toEqual(['a', '-', 'b', '-', 'c']);
    });

    it('should handle single element array', () => {
      expect(Arr.intersperse([1], 0)).toEqual([1]);
      expect(Arr.intersperse(['single'], '|')).toEqual(['single']);
    });

    it('should handle empty array', () => {
      expect(Arr.intersperse([], 0)).toEqual([]);
    });

    it('should handle two element array', () => {
      expect(Arr.intersperse([1, 2], '|')).toEqual([1, '|', 2]);
    });
  });

  describe('flatten', () => {
    it('should flatten nested arrays', () => {
      expect(Arr.flatten([[1, 2], [3, 4], [5]])).toEqual([1, 2, 3, 4, 5]);
      expect(Arr.flatten([['a', 'b'], ['c'], ['d', 'e']])).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should handle empty arrays', () => {
      expect(Arr.flatten([])).toEqual([]);
      expect(Arr.flatten([[], [1, 2], []])).toEqual([1, 2]);
    });

    it('should handle mixed content', () => {
      expect(Arr.flatten([[1], [2, 3, 4], [5, 6]])).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should only flatten one level', () => {
      expect(Arr.flatten([[[1, 2]], [[3, 4]]])).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe('crossJoin', () => {
    it('should create cartesian product of two arrays', () => {
      expect(Arr.crossJoin([1, 2], ['a', 'b'])).toEqual([
        [1, 'a'],
        [1, 'b'],
        [2, 'a'],
        [2, 'b'],
      ]);
    });

    it('should handle single element arrays', () => {
      expect(Arr.crossJoin(['x'], [1, 2, 3])).toEqual([
        ['x', 1],
        ['x', 2],
        ['x', 3],
      ]);
      expect(Arr.crossJoin([1, 2], ['y'])).toEqual([
        [1, 'y'],
        [2, 'y'],
      ]);
    });

    it('should handle empty arrays', () => {
      expect(Arr.crossJoin([], [1, 2])).toEqual([]);
      expect(Arr.crossJoin([1], [])).toEqual([]);
      expect(Arr.crossJoin([], [])).toEqual([]);
    });

    it('should preserve types', () => {
      const result = Arr.crossJoin([true, false], [1, 2]);
      expect(result).toEqual([
        [true, 1],
        [true, 2],
        [false, 1],
        [false, 2],
      ]);
    });
  });

  describe('get', () => {
    const testArray = [1, 2, 3, 4, 5];

    it('should get element at positive index', () => {
      expect(Arr.get(testArray, 0)).toBe(1);
      expect(Arr.get(testArray, 2)).toBe(3);
      expect(Arr.get(testArray, 4)).toBe(5);
    });

    it('should get element at negative index', () => {
      expect(Arr.get(testArray, -1)).toBe(5);
      expect(Arr.get(testArray, -2)).toBe(4);
      expect(Arr.get(testArray, -5)).toBe(1);
    });

    it('should return default value for out of bounds index', () => {
      expect(Arr.get(testArray, 10)).toBeUndefined();
      expect(Arr.get(testArray, 10, 999)).toBe(999);
      expect(Arr.get(testArray, -10, -1)).toBe(-1);
    });

    it('should handle empty array', () => {
      expect(Arr.get([], 0)).toBeUndefined();
      expect(Arr.get([], 0, 'empty')).toBe('empty');
    });
  });

  describe('first', () => {
    it('should return first element', () => {
      expect(Arr.first([1, 2, 3])).toBe(1);
      expect(Arr.first(['a', 'b', 'c'])).toBe('a');
      expect(Arr.first([true, false])).toBe(true);
    });

    it('should return default value for empty array', () => {
      expect(Arr.first([])).toBeUndefined();
      expect(Arr.first([], 'default')).toBe('default');
    });

    it('should work with single element', () => {
      expect(Arr.first([42])).toBe(42);
    });
  });

  describe('last', () => {
    it('should return last element', () => {
      expect(Arr.last([1, 2, 3])).toBe(3);
      expect(Arr.last(['a', 'b', 'c'])).toBe('c');
      expect(Arr.last([true, false])).toBe(false);
    });

    it('should return default value for empty array', () => {
      expect(Arr.last([])).toBeUndefined();
      expect(Arr.last([], 'default')).toBe('default');
    });

    it('should work with single element', () => {
      expect(Arr.last([42])).toBe(42);
    });
  });

  describe('split', () => {
    describe('split by size', () => {
      it('should split array into chunks of specified size', () => {
        expect(Arr.split([1, 2, 3, 4, 5, 6], 2)).toEqual([
          [1, 2],
          [3, 4],
          [5, 6],
        ]);
        expect(Arr.split([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
        expect(Arr.split([1, 2, 3, 4], 3)).toEqual([[1, 2, 3], [4]]);
      });

      it('should handle size larger than array', () => {
        expect(Arr.split([1, 2], 5)).toEqual([[1, 2]]);
      });

      it('should handle size of 1', () => {
        expect(Arr.split([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
      });

      it('should handle empty array', () => {
        expect(Arr.split([], 2)).toEqual([]);
      });
    });

    describe('split by predicate', () => {
      it('should split array based on predicate function', () => {
        const isMultipleOfThree = (item: number) => item % 3 === 0;
        expect(Arr.split([1, 2, 3, 4, 5, 6], isMultipleOfThree)).toEqual([[1, 2], [3, 4, 5], [6]]);
      });

      it('should handle predicate that never matches', () => {
        const alwaysFalse = () => false;
        expect(Arr.split([1, 2, 3], alwaysFalse)).toEqual([[1, 2, 3]]);
      });

      it('should handle predicate that always matches', () => {
        const alwaysTrue = () => true;
        expect(Arr.split([1, 2, 3], alwaysTrue)).toEqual([[1], [2], [3]]);
      });

      it('should provide correct index to predicate', () => {
        const isEvenIndex = (_: any, index: number) => index % 2 === 0 && index > 0;
        expect(Arr.split([1, 2, 3, 4, 5], isEvenIndex)).toEqual([[1, 2], [3, 4], [5]]);
      });
    });
  });

  describe('random', () => {
    it('should return element from array', () => {
      const singleElement = ['only'];
      expect(Arr.random(singleElement)).toBe('only');
    });

    it('should return undefined for empty array', () => {
      expect(Arr.random([])).toBeUndefined();
    });

    it('should return valid element from array', () => {
      const testArray = [1, 2, 3, 4, 5];
      const result = Arr.random(testArray);
      expect(testArray).toContain(result);
    });

    // Test randomness by running multiple times (basic test)
    it('should produce different results over multiple calls', () => {
      const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const results = new Set();

      // Run 20 times to increase chance of getting different values
      for (let i = 0; i < 20; i++) {
        results.add(Arr.random(testArray));
      }

      // With 10 elements and 20 calls, we should get at least 2 different values
      // This is probabilistic but very likely to pass
      expect(results.size).toBeGreaterThan(1);
    });
  });

  describe('shuffle', () => {
    it('should return array with same length', () => {
      const testArray = [1, 2, 3, 4, 5];
      const shuffled = Arr.shuffle(testArray);
      expect(shuffled).toHaveLength(testArray.length);
    });

    it('should contain all original elements', () => {
      const testArray = [1, 2, 3, 4, 5];
      const shuffled = Arr.shuffle(testArray);

      // Sort both arrays to compare content
      expect([...shuffled].sort()).toEqual([...testArray].sort());
    });

    it('should not modify original array', () => {
      const testArray = [1, 2, 3, 4, 5];
      const original = [...testArray];
      Arr.shuffle(testArray);
      expect(testArray).toEqual(original);
    });

    it('should handle empty array', () => {
      expect(Arr.shuffle([])).toEqual([]);
    });

    it('should handle single element array', () => {
      expect(Arr.shuffle([1])).toEqual([1]);
    });

    it('should handle two element array', () => {
      const result = Arr.shuffle([1, 2]);
      expect(result).toHaveLength(2);
      expect(result).toContain(1);
      expect(result).toContain(2);
    });

    // Test that shuffle actually produces different arrangements
    it('should produce different arrangements over multiple calls', () => {
      const testArray = [1, 2, 3, 4, 5];
      const arrangements = new Set();

      // Run 20 times to increase chance of getting different arrangements
      for (let i = 0; i < 20; i++) {
        arrangements.add(JSON.stringify(Arr.shuffle(testArray)));
      }

      // With 5 elements, we should get at least 2 different arrangements
      // This is probabilistic but very likely to pass
      expect(arrangements.size).toBeGreaterThan(1);
    });
  });
});
