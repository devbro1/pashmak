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

///////////////

type StepFn<I, A extends any[], O> = (value: I, ...args: A) => O | Promise<O>;

class Chainer<T> extends Promise<T> {
  private chainPromise: Promise<T>;

  constructor(initial: T) {
    let chainPromise = Promise.resolve(initial);
    super((resolve, reject) => {
      chainPromise.then(resolve).catch(reject);
    });
    this.chainPromise = chainPromise;
  }

  step<A extends any[], R>(fn: StepFn<T, A, R>, ...args: any[]): Chainer<R> {
    const nextChainer = new Chainer(undefined as any);
    (nextChainer as any).chainPromise = this.chainPromise.then((v) => fn(v, ...(args as any)));
    return nextChainer;
  }

  s<A extends any[], R>(fn: StepFn<T, A, R>, ...args: any[]): Chainer<R> {
    return this.step(fn, ...args);
  }

  static from<T>(initial: T): Chainer<T> {
    return new Chainer(initial);
  }
}

/**
 * chains multiple functions/steps together. Each step can be synchronous or asynchronous.
 * To calculate the final result, use `await` on the returned Chainer.
 * @param initial initial value to start
 * @returns final result
 * @example
 * ```ts
 * import { chainer } from "@devbro/pashmak/helpers";
 * const add = (x: number, y: number) => x + y;
 * const multiply = (x: number, y: number) => x * y;
 *
 * const result = await chainer(4)
 *   .step(add, 2)        // 4 + 2 = 6
 *   .step(multiply, 3)   // 6 * 3 = 18
 */
export function chainer<T>(initial: T): Chainer<T> {
  return Chainer.from(initial);
}
