import { Connection } from 'neko-sql/src/Connection';
import { Query } from 'neko-sql/src/Query';
import pluralize from 'pluralize';

export class BaseModel {
  protected tableName: string = '';
  static fillable: string[] = [];
  static primaryKey: string[] = ['id'];
  public id: number | undefined;
  static connection: Connection | (() => Connection) | (() => Promise<Connection>) | undefined;
  protected exists: boolean = false;

  constructor(initialData: any = {}) {
    this.tableName = pluralize(this.constructor.name.toLowerCase());
    for (const key of new.target.fillable) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }

    for (const key of new.target.primaryKey) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }
  }

  public getTablename(): string {
    return this.tableName;
  }

  public static async findByPrimaryKey<T extends typeof BaseModel>(keys: {
    [K in T['primaryKey'][number]]: string | number;
  }): Promise<any> {
    let self = new this();
    let q: Query = await self.getQuery();

    // @ts-ignore
    q.select([
      ...(self.constructor as typeof BaseModel).primaryKey,
      ...(self.constructor as typeof BaseModel).fillable,
    ]);
    for (const key of (self.constructor as typeof BaseModel).primaryKey) {
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
      if (target.constructor.primaryKey.length === 1 && target.constructor.primaryKey[0] === 'id') {
        target.constructor.primaryKey = [];
      }
      target.constructor.primaryKey.push(propertyKey);
    } else {
      target.constructor.fillable.push(propertyKey);
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
