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

/**
 * Creates a chainable pipeline for sequential async transformations.
 * Each step receives the result of the previous step and can perform async operations.
 * The chain is thenable, allowing it to be awaited or used with .then().
 *
 * @example
 * ```typescript
 * const result = await chainer(5)
 *   .step([(x, multiplier) => x * multiplier, [2]])
 *   .step([(x) => x + 10, []])
 *   .step([(x) => Promise.resolve(x.toString()), []]);
 * // result: "20"
 * ```
 *
 * @template T - The initial value type
 * @param initial - The starting value for the chain
 * @returns A Promise that can have steps added and can be awaited
 */
export function chainer<T>(initial: any): Promise<T> & { step: typeof chainer.prototype.step } {
  let chainPromise = Promise.resolve(initial);

  const api: any = new Promise((resolve, reject) => {
    chainPromise.then(resolve).catch(reject);
  });

  api.step = function <A extends any[], R>([fn, args]: [(v: T, ...a: A) => R | Promise<R>, A]) {
    chainPromise = chainPromise.then((v) => fn(v, ...(args as any)));
    return api;
  };

  return api as Promise<T> & { step: typeof api.step };
}
