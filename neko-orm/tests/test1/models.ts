import { Connection } from 'neko-sql/src/Connection';
import { Query } from 'neko-sql/src/Query';
import { Parameter } from 'neko-sql/src/types';
import pluralize from 'pluralize';

export class BaseModel {
  protected tableName: string = '';
  protected fillable: string[] = [];
  protected primaryKey: string[] = ['id'];
  public id: number | undefined;
  static connection: Connection | (() => Connection) | (() => Promise<Connection>) | undefined;
  protected exists: boolean = false;

  constructor(initialData: any = {}) {
    this.tableName = pluralize(this.constructor.name.toLowerCase());
    this.fillable = this.constructor.prototype.fillable ?? [];
    this.primaryKey = this.constructor.prototype.primaryKey ?? ['id'];

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
    for (const key of [...this.primaryKey, ...this.fillable]) {
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
      await q.insert(params);
      this.exists = true;
    }
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

  public static setConnection(conn: Connection) {
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

  public async getQuery(): Promise<any> {
    const conn = await BaseModel.getConnection();
    let rc = conn.getQuery();
    rc.table(this.tableName);
    return rc;
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
