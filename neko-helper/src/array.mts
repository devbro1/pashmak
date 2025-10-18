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
