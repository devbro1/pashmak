import { Connection } from 'neko-sql/src/Connection';
import { Query } from 'neko-sql/src/Query';
import { Parameter } from 'neko-sql/src/types';
import pluralize from 'pluralize';

export class BaseModel {
  protected tableName: string = '';
  protected fillable: string[] = [];
  protected primaryKey: string[] = ['id'];
  protected incrementing: boolean = true;
  public id: number | undefined = undefined;
  static connection: Connection | (() => Connection) | (() => Promise<Connection>) | undefined;
  protected exists: boolean = false;
  protected guarded: string[] = [];

  constructor(initialData: any = {}) {
    this.id = undefined;
    this.tableName = pluralize(this.constructor.name.toLowerCase());
    this.fillable = this.constructor.prototype.fillable ?? [];
    this.primaryKey = this.constructor.prototype.primaryKey ?? ['id'];
    this.incrementing = this.constructor.prototype.incrementing ?? true;

    for (const key of this.fillable) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }

    for (const key of this.primaryKey) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }
  }

  public getTablename(): string {
    return this.tableName;
  }

  public async save() {
    const q: Query = await this.getQuery();
    const params: Record<string, Parameter> = {};

    if(!this.incrementing || this.exists) {
      for (const key of this.primaryKey) {
        // @ts-ignore
        params[key] = this[key];
      }
    }

    for (const key of this.fillable) {
      // @ts-ignore
      params[key] = this[key];
    }

    if (this.exists) {
      for (const pkey of this.primaryKey) {
        // @ts-ignore
        q.whereOp(pkey, '=', this[pkey]);
      }
      await q.update(params);
    } else {
      const result = this.incrementing ? await q.insertGetId(params) : await q.insert(params);
      if(this.incrementing && !this.exists) {
        for (const key of this.primaryKey) {
          // @ts-ignore
          this[key] = result[0][key];
        }
      }
      this.exists = true;
    }
  }

  public async delete() {
    const q: Query = await this.getQuery();
    for (const pkey of this.primaryKey) {
      // @ts-ignore
      q.whereOp(pkey, '=', this[pkey]);
    }
    await q.delete();
    this.exists = false;
  }

  public async refresh() {
    const q: Query = await this.getQuery();
    for (const pkey of this.primaryKey) {
      // @ts-ignore
      q.whereOp(pkey, '=', this[pkey]);
    }
    q.limit(1);
    let r = await q.get();
    if (r.length === 0) {
      throw new Error('No record found');
    }

    for (const k in r[0]) {
      // @ts-ignore
      this[k] = r[0][k];
    }
  }

  public static async find(id: number) {
    return this.findByPrimaryKey({ id });
  }

  public static async findByPrimaryKey<T extends typeof BaseModel>(
    keys: Record<string, Parameter>
  ): Promise<any> {
    let self = new this();
    let q: Query = await self.getQuery();

    // @ts-ignore
    q.select([...self.primaryKey, ...self.fillable]);
    for (const key of self.primaryKey) {
      // @ts-ignore
      q.whereOp(key, '=', keys[key]);
    }
    q.limit(1);

    let r = await q.get();

    if (r.length === 0) {
      return undefined;
    }

    for (const k in r[0]) {
      // @ts-ignore
      self[k] = r[0][k];
    }

    self.exists = true;

    return self;
  }

  public static setConnection(conn: Connection | (() => Connection) | (() => Promise<Connection>)) {
    BaseModel.connection = conn;
  }

  public static async getConnection(): Promise<Connection> {
    if (typeof BaseModel.connection === 'undefined') {
      throw new Error('Connection is not defined');
    } else if (typeof BaseModel.connection === 'function') {
      return await BaseModel.connection();
    }
    return BaseModel.connection;
  }

  public async getQuery(): Promise<Query> {
    const conn = await BaseModel.getConnection();
    let rc = conn.getQuery();
    rc.table(this.tableName);
    return rc;
  }

  public static async getQuery(): Promise<any> {
    const conn = await BaseModel.getConnection();
    let rc = conn.getQuery();
    let self = new this();
    rc.table(self.tableName);
    return rc;
  }

  public fill(data: Record<string, Parameter>) {
    for (const key of this.fillable) {
      if (typeof data[key] !== 'undefined') {
        // @ts-ignore
        this[key] = data[key];
      }
    }
  }

  public toJson() {
    const data: Record<string, Parameter> = {};
    for (const key of [...this.primaryKey, ...this.fillable]) {
      if (this.guarded.includes(key)) {
        continue;
      }

      // @ts-ignore
      data[key] = this[key];
    }
    return data;
  }
}

export class Region extends BaseModel {
  protected tableName: string = 'regions';
  protected fillable: string[] = ['region_name'];
  protected primaryKey: string[] = ['region_id'];
}

type AttributeOptions = {
  primaryKey?: boolean;
};

function Attribute(options: AttributeOptions = {}) {
  return function (target: any, propertyKey: string) {
    if (options.primaryKey === true) {
      if (!target.constructor.prototype.primaryKey) {
        target.constructor.prototype.primaryKey = [];
      } else if (
        target.constructor.prototype.primaryKey.length === 1 &&
        target.constructor.prototype.primaryKey[0] === 'id'
      ) {
        target.constructor.prototype.primaryKey = [];
      }
      target.constructor.prototype.primaryKey.push(propertyKey);
      target.constructor.prototype.incrementing = false;
    } else {
      if (!target.constructor.prototype.fillable) {
        target.constructor.prototype.fillable = [];
      }
      target.constructor.prototype.fillable.push(propertyKey);
    }

    Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: undefined,
    });

    return target;
  };
}

export class Country extends BaseModel {
  protected tableName: string = 'countries';

  @Attribute({ primaryKey: true })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;
}

export class Job extends BaseModel {
  @Attribute()
  public title: string | undefined;

  @Attribute()
  public min_salary: number | undefined;

  @Attribute()
  public max_salary: number | undefined;
}
