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

/**
 * given a function fn, repeat it every interval milliseconds.
 * rc.start() to start the repeater
 * rc.stop() to stop the repeater
 * createRepeater(fn, 5000); // run fn every 5 seconds
 * @param fn
 * @param interval
 * @returns
 */
export function createRepeater(fn: Function, interval: number) {
  let timer: undefined | number = undefined;

  return {
    start() {
      if (!timer) {
        timer = setInterval(fn, interval);
      }
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = undefined;
      }
    },
  };
}
