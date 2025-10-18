import { AsyncLocalStorage } from 'async_hooks';

export class Context {
  private _context: Record<string, any> = {};
  private _asyncLocalStorage: AsyncLocalStorage<Context> = new AsyncLocalStorage();

  set(key: string | string[], value: any) {
    this._context[this.generateContextKey(key)] = value;
  }

  get<T>(key: string | string[]) {
    return this._context[this.generateContextKey(key)] as T;
  }

  generateContextKey(key: string | string[]) {
    let new_key = '';
    if (Array.isArray(key)) {
      new_key = key.join('.');
    } else {
      new_key = key;
    }
    return new_key;
  }

  getOrThrow<T>(key: string | string[]) {
    key = this.generateContextKey(key);
    const rc = this.get<T>(key);
    if (rc === undefined) {
      throw new Error(`Key ${key} not found in context`);
    }
    return rc;
  }

  has(key: string | string[]): boolean {
    return this.generateContextKey(key) in this._context;
  }

  delete(key: string | string[]) {
    delete this._context[this.generateContextKey(key)];
  }

  keys() {
    return Object.keys(this._context);
  }

  start() {
    this._asyncLocalStorage = new AsyncLocalStorage();
  }

  async run(callback: () => void) {
    return await this._asyncLocalStorage.run(this, callback);
  }
}

export class ContextProvider {
  private _asyncLocalStorage: AsyncLocalStorage<Context> = new AsyncLocalStorage<Context>();

  async run(callback: () => Promise<void>) {
    let cfunc = callback;
    if (typeof this.preloader == 'function') {
      cfunc = async () => {
        await this.preloader(callback);
      };
    }
    return this._asyncLocalStorage.run(new Context(), cfunc);
  }

  getStore(): Context {
    const rc = this._asyncLocalStorage.getStore();
    if (!rc) {
      throw new Error('Context has not started');
    }
    return rc;
  }

  isActive(): boolean {
    return this._asyncLocalStorage.getStore() !== undefined;
  }

  private preloader: Function = async (a: any) => await a();

  setPreLoader(func: (callback: () => void) => void) {
    this.preloader = func;
  }
}

export const context_provider = new ContextProvider();

/**
 * returns storage of current execution context. will throw an error if called outside of an execution context
 * or from wrong execution context.
 * @returns return context
 */
export function ctx() {
  return context_provider.getStore();
}

ctx.isActive = function (): boolean {
  return context_provider.isActive();
};

/**
 * returns storage of current execution context, unlike ctx() will return undefined instead of throwing an error
 * @returns context or undefined
 */
export function ctxSafe() {
  try {
    return ctx();
  } catch {}
}
