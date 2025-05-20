export function createSingleton<T>(
  func: (...args: any[]) => T
): (label?: string, ...args: any[]) => T {
  let instance: Record<string, T> = {};
  return (label = 'default', ...args: any[]): T => {
    if (!instance[label]) {
      instance[label] = func(label, ...args);
    }
    return instance[label];
  };
}
