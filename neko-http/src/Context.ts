import { AsyncLocalStorage } from 'async_hooks';

export class Context {
  private _context: Record<string, any> = {};
  private _asyncLocalStorage: AsyncLocalStorage<Context> = new AsyncLocalStorage();

  set(key: string, value: any) {
    this._context[key] = value;
  }

  get<T>(key: string) {
    return this._context[key] as T;
  }

  getOrThrow<T>(key: string) {
    let rc = this.get<T>(key);
    if (rc === undefined) {
      throw new Error(`Key ${key} not found in context`);
    }
    return rc;
  }

  has(key: string) {
    return key in this._context;
  }

  delete(key: string) {
    delete this._context[key];
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

  async run(callback: () => void) {
    return this._asyncLocalStorage.run(new Context(), callback);
  }

  getStore(): Context {
    let rc = this._asyncLocalStorage.getStore();
    if (!rc) {
      throw new Error('Context not started');
    }
    return rc;
  }
}

// export let cp = new ContextProvider();

// export function ctx(): Context {
//     return cp.getStore();
// }
