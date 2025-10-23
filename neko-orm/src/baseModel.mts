import { Connection } from '@devbro/neko-sql';
import { Query } from '@devbro/neko-sql';
import { Parameter } from '@devbro/neko-sql';
import pluralize from 'pluralize';
import { snakeCase } from 'change-case-all';
import { GlobalScope } from './GlobalScope.mjs';
import { LocalScopeQuery } from './LocalScopeQuery.mjs';

export type saveObjectOptions = {
  updateTimestamps: boolean;
};
export class BaseModel {
  static getLocalScopesQuery: (() => typeof Query) | undefined;
  [key: string]: any;
  protected tableName: string = '';
  protected fillable: string[] = [];
  protected primaryKey: string[] = ['id'];
  declare _incrementing_primary_keys: boolean;
  public id: number | undefined = undefined;
  static connection: Connection | (() => Connection) | undefined;
  protected _exists: boolean = false;
  declare _guarded: string[];
  protected hasTimestamps = true;
  protected timestampFormat = 'yyyy-MM-dd HH:mm:ss.SSS';
  protected createdAtFieldName = 'created_at';
  protected updatedAtFieldName = 'updated_at';
  declare _casters: Record<string, Function>;
  declare _mutators: Record<string, Function>;
  declare scopes: (typeof GlobalScope)[]; // list of global scope classes that will be applied
  public localScope: LocalScopeQuery<BaseModel> | undefined;
  declare _attributes: Record<string, any>;
  declare _fillable: string[];
  declare _primary_keys: string[];
  declare _default_values: Record<string, any>;

  constructor(initialData: any = {}) {
    this.tableName = pluralize(snakeCase(this.constructor.name));

    this._attributes = this._attributes || {};
    this._fillable = this._fillable || [];
    this._primary_keys = this._primary_keys || ['id'];
    this._casters = this._casters || {};
    this._mutators = this._mutators || {};
    this._guarded = this._guarded || [];
    this._incrementing_primary_keys = this._incrementing_primary_keys ?? true;
    this._default_values = this._default_values || {};

    this.scopes = this.scopes || [];
    this._attributes = { ...this._default_values };
    this.fill(initialData);
  }

  public getTablename(): string {
    return this.tableName;
  }

  static getClassName() {
    return this.name;
  }

  public getClassName() {
    return this.constructor.name;
  }

  public async save(
    options: saveObjectOptions = {
      updateTimestamps: true,
    }
  ) {
    const q: Query = await this.getQuery();
    const params: Record<string, Parameter> = {};

    if (!this._incrementing_primary_keys || this.exists) {
      for (const key of this._primary_keys) {
        // @ts-ignore
        params[key] = this[key];
      }
    }

    for (const key of this._fillable) {
      if (!this._primary_keys.includes(key)) {
        params[key] = this[key];
      }
    }

    // adjust timestamps
    if (this.hasTimestamps && options.updateTimestamps) {
      params[this.updatedAtFieldName] = new Date();
      if (!this.exists || !params[this.createdAtFieldName]) {
        params[this.createdAtFieldName] = params[this.updatedAtFieldName];
      }
    }

    for (const key of Object.keys(params)) {
      if (this._casters[key]) {
        params[key] = await this._casters[key](params[key]);
      }
    }

    let result;
    if (this.exists) {
      for (const pkey of this._primary_keys) {
        // @ts-ignore
        q.whereOp(pkey, '=', this[pkey]);
      }
      await q.update(params);
    } else if (this._incrementing_primary_keys) {
      result = await q.insertGetId(params, { primaryKey: this._primary_keys });
      for (const key of this._primary_keys) {
        this[key] = result[0][key];
      }
    } else {
      for (const key of this._primary_keys) {
        params[key] = this[key];
      }
      result = await q.insert(params);
    }

    this.exists = true;

    await this.refresh();
  }

  public async delete() {
    const q: Query = await this.getQuery();
    for (const pkey of this._primary_keys) {
      // @ts-ignore
      q.whereOp(pkey, '=', this[pkey]);
    }
    await q.delete();
    this.exists = false;
  }

  public async refresh() {
    const q: Query = await this.getQuery();
    for (const pkey of this._primary_keys) {
      // @ts-ignore
      q.whereOp(pkey, '=', this[pkey]);
    }
    q.limit(1);
    let r = await q.get();
    if (r.length === 0) {
      throw new Error('No record found');
    }

    await this.fillAndMutate(r[0]);
  }

  async fillAndMutate(r: object) {
    for (const k in r) {
      // @ts-ignore
      this[k] = r[k];

      if (this[k] === null) {
        this[k] = undefined;
      }

      if (this._mutators[k]) {
        this[k] = await this._mutators[k](this[k]);
      }
    }
  }

  public static async find<T extends typeof BaseModel>(
    id: number,
    options = { withGlobalScopes: true }
  ): Promise<InstanceType<T> | undefined> {
    return this.findByPrimaryKey<T>({ id }, options);
  }

  public static async findOne<T extends BaseModel>(
    conditions: object,
    options = { withGlobalScopes: true }
  ): Promise<T | undefined> {
    let self = new this();
    let q: Query = await (self.constructor as typeof BaseModel).getQuery(options);

    for (const [key, value] of Object.entries(conditions)) {
      q.whereOp(key, '=', value);
    }
    q.limit(1);

    let r = await q.get();
    if (r.length === 0) {
      return undefined;
    }

    await self.fillAndMutate(r[0]);
    self.exists = true;
    return self as T;
  }

  public static async findorFail<T extends typeof BaseModel>(
    id: number,
    options = { withGlobalScopes: true }
  ): Promise<InstanceType<T>> {
    const rc = await this.find<T>(id, options);
    if (!rc) {
      throw new Error('Not found');
    }
    return rc;
  }

  public static async findByPrimaryKey<T extends typeof BaseModel>(
    keys: Record<string, Parameter>,
    options = { withGlobalScopes: true }
  ): Promise<any> {
    let self = new this();
    let q: Query = await (self.constructor as typeof BaseModel).getQuery(options);

    q.select([...self._primary_keys, ...self._fillable]);
    for (const key of self._primary_keys) {
      q.whereOp(key, '=', keys[key]);
    }
    q.limit(1);

    let r = await q.get();
    if (r.length === 0) {
      return undefined;
    }

    await self.fillAndMutate(r[0]);
    self.exists = true;

    return self;
  }

  public static setConnection(conn: Connection | (() => Connection)) {
    BaseModel.connection = conn;
  }

  public static getConnection(): Connection {
    if (typeof BaseModel.connection === 'undefined') {
      throw new Error('Connection is not defined');
    } else if (typeof BaseModel.connection === 'function') {
      return BaseModel.connection();
    }
    return BaseModel.connection;
  }

  // public getQuery(options = { withGlobalScopes: true }): Query {
  //   const conn = BaseModel.getConnection();
  //   let rc = conn.getQuery();
  //   rc.table(this.tableName);

  //   if (this.scopes && options.withGlobalScopes === true) {
  //     for (const Scope of this.scopes) {
  //       const scope = new Scope();
  //       rc = scope.apply(rc, this);
  //     }
  //   }

  //   return rc;
  // }

  public getQuery(): ReturnType<typeof BaseModel.getQuery> {
    return (this.constructor as typeof BaseModel).getQuery();
  }

  public static getQuery(
    options: { withGlobalScopes: boolean } = { withGlobalScopes: true }
  ): ReturnType<typeof this.prototype.getLocalScopesQuery> {
    const opts = { ...options, withGlobalScopes: true };
    let QueryClass = Query;
    if (typeof this.getLocalScopesQuery === 'function') {
      QueryClass = this.getLocalScopesQuery();
    }
    const conn = this.getConnection();
    let rc = new QueryClass(conn, conn.getQueryGrammar());
    const self = new this();

    rc.table(self.tableName);

    if (options.withGlobalScopes === true && self.scopes) {
      for (const Scope of self.scopes) {
        const scope = new Scope();
        rc = scope.apply(rc, self);
      }
    }
    return rc;
  }

  public fill(data: Record<string, Parameter>) {
    for (const key of [...this._primary_keys, ...this._fillable]) {
      if (key in data) {
        // @ts-ignore
        this[key] = data[key];
      }
    }
  }

  public toJson() {
    const data: Record<string, Parameter> = {};
    for (const key of [...this._primary_keys, ...this._fillable]) {
      if (this._guarded.includes(key)) {
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

  public static newInstance<T extends BaseModel>(
    initialData: any = {},
    exists: boolean = false
  ): T {
    let rc = new this(initialData);
    rc.exists = exists;
    return rc as T;
  }

  public static async create<T extends BaseModel>(initialData: any = {}): Promise<T> {
    let rc = new this(initialData);
    await rc.save();
    return rc as T;
  }
}
