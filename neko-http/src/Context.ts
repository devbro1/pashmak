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
    const rc = this._asyncLocalStorage.getStore();
    if (!rc) {
      throw new Error('Context not started');
    }
    return rc;
  }
}
