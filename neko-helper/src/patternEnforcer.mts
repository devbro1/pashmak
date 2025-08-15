/**
 * create a singleton using the function provided.
 * @param func - a function that will be called to create the instance.
 * @returns A function that return a singleton instance of the type T for a given label.
 */
export function createSingleton<T>(
  func: (...args: any[]) => T
): (label?: string, ...args: any[]) => T {
  const instance: Record<string, T> = {};
  return (label = 'default', ...args: any[]): T => {
    if (!instance[label]) {
      instance[label] = func(label, ...args);
    }
    return instance[label];
  };
}
