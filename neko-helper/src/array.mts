/**
 * Intersperses a separator element between each element of an array.
 *
 * Takes an array and a separator value, and returns a new array where the separator
 * is inserted between each pair of adjacent elements from the original array.
 * The separator is not added before the first element or after the last element.
 *
 * @template T - The type of elements in the input array
 * @template S - The type of the separator element
 * @param arr - The input array to intersperse
 * @param sep - The separator element to insert between array elements
 * @returns A new array with separator elements interspersed between original elements
 *
 * @example
 * ```typescript
 * intersperse([1, 2, 3], 0)
 * // Returns: [1, 0, 2, 0, 3]
 *
 * intersperse(['a', 'b', 'c'], '-')
 * // Returns: ['a', '-', 'b', '-', 'c']
 *
 * intersperse([1], 0)
 * // Returns: [1]
 *
 * intersperse([], 0)
 * // Returns: []
 * ```
 */
export function intersperse<T, S>(arr: T[], sep: S): (T | S)[] {
  return arr.flatMap((v, i) => (i < arr.length - 1 ? [v, sep] : [v]));
}

/**
 * Flattens a nested array by one level.
 *
 * Takes an array of arrays and returns a new array with all sub-arrays
 * concatenated into a single level. Only flattens one level deep.
 *
 * @template T - The type of elements in the nested arrays
 * @param arr - The array of arrays to flatten
 * @returns A new flattened array containing all elements from the sub-arrays
 *
 * @example
 * ```typescript
 * flatten([[1, 2], [3, 4], [5]])
 * // Returns: [1, 2, 3, 4, 5]
 *
 * flatten([['a', 'b'], ['c'], ['d', 'e']])
 * // Returns: ['a', 'b', 'c', 'd', 'e']
 *
 * flatten([])
 * // Returns: []
 *
 * flatten([[], [1, 2], []])
 * // Returns: [1, 2]
 * ```
 */
export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Creates a cross join (Cartesian product) of two arrays.
 *
 * Takes two arrays and returns an array of tuples representing all possible
 * combinations where the first element comes from the first array and the
 * second element comes from the second array.
 *
 * @template T - The type of elements in the first array
 * @template U - The type of elements in the second array
 * @param arr1 - The first array
 * @param arr2 - The second array
 * @returns An array of tuples representing all combinations
 *
 * @example
 * ```typescript
 * crossJoin([1, 2], ['a', 'b'])
 * // Returns: [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
 *
 * crossJoin(['x'], [1, 2, 3])
 * // Returns: [['x', 1], ['x', 2], ['x', 3]]
 *
 * crossJoin([], [1, 2])
 * // Returns: []
 *
 * crossJoin([1], [])
 * // Returns: []
 * ```
 */
export function crossJoin<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  const result: [T, U][] = [];
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      result.push([item1, item2]);
    }
  }
  return result;
}

/**
 * Gets an element from an array at the specified index.
 *
 * Retrieves an element at the given index. Supports negative indices to count
 * from the end of the array. Returns the default value if the index is out of bounds.
 *
 * @template T - The type of elements in the array
 * @template D - The type of the default value
 * @param arr - The array to get the element from
 * @param index - The index to get, negative values count from the end
 * @param defaultValue - The value to return if index is out of bounds
 * @returns The element at the specified index or the default value
 *
 * @example
 * ```typescript
 * get([1, 2, 3, 4], 1)
 * // Returns: 2
 *
 * get([1, 2, 3, 4], -1)
 * // Returns: 4
 *
 * get([1, 2, 3], 10, 'default')
 * // Returns: 'default'
 *
 * get([], 0, 'empty')
 * // Returns: 'empty'
 * ```
 */
export function get<T, D = T>(arr: T[], index: number, defaultValue?: D): T | D | undefined {
  if (arr.length === 0) return defaultValue;

  const actualIndex = index < 0 ? arr.length + index : index;

  if (actualIndex < 0 || actualIndex >= arr.length) {
    return defaultValue;
  }

  return arr[actualIndex];
}

/**
 * Gets the first element of an array.
 *
 * Returns the first element of the array, or the default value if the array is empty.
 *
 * @template T - The type of elements in the array
 * @template D - The type of the default value
 * @param arr - The array to get the first element from
 * @param defaultValue - The value to return if array is empty
 * @returns The first element or the default value
 *
 * @example
 * ```typescript
 * first([1, 2, 3])
 * // Returns: 1
 *
 * first(['a', 'b', 'c'])
 * // Returns: 'a'
 *
 * first([], 'default')
 * // Returns: 'default'
 *
 * first([])
 * // Returns: undefined
 * ```
 */
export function first<T, D = T>(arr: T[], defaultValue?: D): T | D | undefined {
  return arr.length > 0 ? arr[0] : defaultValue;
}

/**
 * Gets the last element of an array.
 *
 * Returns the last element of the array, or the default value if the array is empty.
 *
 * @template T - The type of elements in the array
 * @template D - The type of the default value
 * @param arr - The array to get the last element from
 * @param defaultValue - The value to return if array is empty
 * @returns The last element or the default value
 *
 * @example
 * ```typescript
 * last([1, 2, 3])
 * // Returns: 3
 *
 * last(['a', 'b', 'c'])
 * // Returns: 'c'
 *
 * last([], 'default')
 * // Returns: 'default'
 *
 * last([])
 * // Returns: undefined
 * ```
 */
export function last<T, D = T>(arr: T[], defaultValue?: D): T | D | undefined {
  return arr.length > 0 ? arr[arr.length - 1] : defaultValue;
}

/**
 * Splits an array into chunks based on size or a predicate function.
 *
 * If a number is provided, splits the array into chunks of that size.
 * If a function is provided, splits the array at positions where the function returns true.
 *
 * @template T - The type of elements in the array
 * @param arr - The array to split
 * @param sizeOrFunc - Either the chunk size (number) or a predicate function
 * @returns An array of arrays representing the chunks
 *
 * @example
 * ```typescript
 * split([1, 2, 3, 4, 5, 6], 2)
 * // Returns: [[1, 2], [3, 4], [5, 6]]
 *
 * split([1, 2, 3, 4, 5], 2)
 * // Returns: [[1, 2], [3, 4], [5]]
 *
 * split([1, 2, 3, 4, 5], (item, index) => item % 3 === 0)
 * // Returns: [[1, 2], [3], [4, 5]]
 *
 * split([], 2)
 * // Returns: []
 * ```
 */
export function split<T>(
  arr: T[],
  sizeOrFunc: number | ((item: T, index: number) => boolean)
): T[][] {
  if (arr.length === 0) return [];

  if (typeof sizeOrFunc === 'number') {
    const size = sizeOrFunc;
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  } else {
    const predicate = sizeOrFunc;
    const result: T[][] = [];
    let current: T[] = [];

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];

      if (predicate(item, i) && current.length > 0) {
        result.push(current);
        current = [item];
      } else {
        current.push(item);
      }
    }

    if (current.length > 0) {
      result.push(current);
    }

    return result;
  }
}

/**
 * Returns a random element from an array.
 *
 * Selects and returns a random element from the array. Returns undefined if the array is empty.
 *
 * @template T - The type of elements in the array
 * @param arr - The array to select a random element from
 * @returns A random element from the array or undefined if empty
 *
 * @example
 * ```typescript
 * random([1, 2, 3, 4, 5])
 * // Returns: any element from the array (e.g., 3)
 *
 * random(['apple', 'banana', 'cherry'])
 * // Returns: any string from the array (e.g., 'banana')
 *
 * random([])
 * // Returns: undefined
 *
 * random(['single'])
 * // Returns: 'single'
 * ```
 */
export function random<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

/**
 * Returns a new array with elements shuffled in random order.
 *
 * Creates a new array with the same elements as the input array but in a random order.
 * Uses the Fisher-Yates shuffle algorithm for uniform distribution.
 *
 * @template T - The type of elements in the array
 * @param arr - The array to shuffle
 * @returns A new array with elements in random order
 *
 * @example
 * ```typescript
 * shuffle([1, 2, 3, 4, 5])
 * // Returns: [3, 1, 5, 2, 4] (example, actual order will be random)
 *
 * shuffle(['a', 'b', 'c'])
 * // Returns: ['c', 'a', 'b'] (example, actual order will be random)
 *
 * shuffle([])
 * // Returns: []
 *
 * shuffle(['single'])
 * // Returns: ['single']
 * ```
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Creates a deep clone of an object using JSON serialization.
 *
 * Performs a deep copy of an object by converting it to JSON and back.
 * This method is simple but has limitations: it cannot clone functions,
 * undefined values, symbols, or circular references.
 *
 * @param obj - The object to clone
 * @returns A deep clone of the input object
 *
 * @example
 * ```typescript
 * deepClone({ a: 1, b: { c: 2 } })
 * // Returns: { a: 1, b: { c: 2 } } (new object)
 *
 * const original = { x: [1, 2, 3], y: { z: 4 } };
 * const cloned = deepClone(original);
 * cloned.x.push(4);
 * // original.x is still [1, 2, 3]
 * ```
 */
export function deepClone(obj: Record<string, any>) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deeply merges two objects based on these rules.
 * - for every given object key:
 *  - if firstObject has the key but secondObject doesn't, firstObject's value is used
 *  - if secondObject has the key but firstObject doesn't, secondObject's value is used
 *  - if both values are primitive, the secondObject's value will be used
 *  - if both values are objects, they are merged recursively
 *  - if both values are arrays, secondObject's array will be used
 *  - if the values are of different types, the second value will be used
 *
 * @param firstObj First object to merge from
 * @param secondObj Second object to merge into
 * @returns The merged object
 */
export function deepMerge(
  firstObj: Record<string, any>,
  secondObj: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = deepClone(firstObj);

  for (const key in secondObj) {
    if (!secondObj.hasOwnProperty(key)) {
      continue;
    }
    const secondValue = secondObj[key];
    const firstValue = result[key];

    // If firstObj doesn't have the key, use secondObj's value
    if (!(key in result)) {
      result[key] = secondValue;
      continue;
    }

    // Check if both values are plain objects (not arrays, null, or other objects)
    const isSecondObject =
      secondValue !== null && typeof secondValue === 'object' && !Array.isArray(secondValue);
    const isFirstObject =
      firstValue !== null && typeof firstValue === 'object' && !Array.isArray(firstValue);

    if (isFirstObject && isSecondObject) {
      // Both are objects - merge recursively
      result[key] = deepMerge(firstValue, secondValue);
    } else {
      // For primitives, arrays, or mismatched types - use secondObj's value
      result[key] = secondValue;
    }
  }

  return result;
}
