export class Global {
  static _vars: Record<string, any> = {};

  static set(key: string | string[], value: any) {
    this._vars[Global.generateInternalKey(key)] = value;
  }

  static get<T>(key: string | string[]): T | undefined {
    return this._vars[Global.generateInternalKey(key)] as T;
  }

  static getOrThrow<T>(key: string | string[]): T {
    const rc = this.get<T>(key);
    if (rc === undefined) {
      throw new Error(
        `Key ${Global.generateInternalKey(key)} not found in Global`,
      );
    }
    return rc;
  }

  static generateInternalKey(key: string | string[]) {
    let new_key = "";
    if (Array.isArray(key)) {
      new_key = key.join(".");
    } else {
      new_key = key;
    }
    return new_key;
  }

  static has(key: string | string[]): boolean {
    return Global.generateInternalKey(key) in Global._vars;
  }
  static delete(key: string | string[]) {
    delete Global._vars[Global.generateInternalKey(key)];
  }

  static keys() {
    return Object.keys(Global._vars);
  }
}
