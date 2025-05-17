export function createSingleton<T>(func: (...args: any[]) => T): () => T {
  let instance: T;
  return (...args: any[]): T => {
    if (!instance) {
      instance = func(...args);
    }
    return instance;
  };
}
