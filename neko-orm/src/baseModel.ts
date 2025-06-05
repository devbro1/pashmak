import { Connection } from 'neko-sql/src/Connection';
import { Query } from 'neko-sql/src/Query';
import { Parameter } from 'neko-sql/src/types';
import pluralize from 'pluralize';

export class BaseModel {
  [key: string]: any;
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

    if (!this.incrementing || this.exists) {
      for (const key of this.primaryKey) {
        // @ts-ignore
        params[key] = this[key];
      }
    }

    for (const key of this.fillable) {
      if (this[key] !== undefined) {
        params[key] = this[key];
      }
    }

    if (this.exists) {
      for (const pkey of this.primaryKey) {
        // @ts-ignore
        q.whereOp(pkey, '=', this[pkey]);
      }
      await q.update(params);
      return;
    } else if (this.incrementing) {
      const result = await q.insertGetId(params, { primaryKey: this.primaryKey });
      for (const key of this.primaryKey) {
        this[key] = result[0][key];
      }
    } else {
      for (const key of this.primaryKey) {
        params[key] = this[key];
      }
      const result = await q.insert(params);
    }
    this.exists = true;
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

  public static async find<T extends typeof BaseModel>(id: number) {
    return this.findByPrimaryKey<T>({ id });
  }

  public static async findOne<T extends typeof BaseModel>(conditions: object) {
    let self = new this();
    let q: Query = await self.getQuery();

    for (const [key, value] of Object.entries(conditions)) {
      q.whereOp(key, '=', value);
    }
    q.limit(1);

    let r = await q.get();
    if (r.length === 0) {
      return undefined;
    }

    self.fill(r[0]);

    self.exists = true;
    return self;
  }

  public static async findorFail<T extends typeof BaseModel>(id: number) {
    const rc = this.find<T>(id);
    if (!rc) {
      throw new Error('Not found');
    }
    return rc;
  }

  public static async findByPrimaryKey<T extends typeof BaseModel>(
    keys: Record<string, Parameter>
  ): Promise<any> {
    let self = new this();
    let q: Query = await self.getQuery();

    q.select([...self.primaryKey, ...self.fillable]);
    for (const key of self.primaryKey) {
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

      if (this[key] instanceof Date) {
        data[key] = this[key].toISOString();
        continue;
      }

      data[key] = this[key];
    }
    return data;
  }
}
