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
  declare _dirties: Set<string>;

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
    this._dirties = new Set<string>();

    this.scopes = this.scopes || [];
    this._attributes = { ...this._default_values };
    this.fill(initialData);
  }

  /**
   * Gets the table name for this model instance.
   *
   * @returns The table name in the database
   */
  public getTablename(): string {
    return this.tableName;
  }

  /**
   * Gets the class name of the model (static method).
   *
   * @returns The name of the model class
   */
  static getClassName() {
    return this.name;
  }

  /**
   * Gets the class name of the model instance.
   *
   * @returns The name of the model class
   */
  public getClassName() {
    return this.constructor.name;
  }

  /**
   * Saves the model to the database. Creates a new record if the model doesn't exist,
   * or updates the existing record if it does.
   *
   * @param options - Save options
   * @param options.updateTimestamps - Whether to update timestamp fields (default: true)
   * @returns A promise that resolves when the save operation is complete
   *
   * @example
   * const user = new User({ name: 'John', email: 'john@example.com' });
   * await user.save();
   *
   * @example
   * // Save without updating timestamps
   * await user.save({ updateTimestamps: false });
   */
  public async save(
    options: saveObjectOptions = {
      updateTimestamps: true,
    }
  ) {
    const q: Query = await this.getQuery();
    const params: Record<string, Parameter> = {};

    if (!this._incrementing_primary_keys || this._exists) {
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
      if (!this._exists || !params[this.createdAtFieldName]) {
        params[this.createdAtFieldName] = params[this.updatedAtFieldName];
      }
    }

    for (const key of Object.keys(params)) {
      if (this._casters[key]) {
        params[key] = await this._casters[key](params[key]);
      }
    }

    let result;
    if (this._exists) {
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

    this._exists = true;

    this._dirties.clear();
    await this.refresh();
  }

  /**
   * Deletes the model from the database.
   *
   * @returns A promise that resolves when the delete operation is complete
   *
   * @example
   * const user = await User.find(1);
   * await user.delete();
   */
  public async delete() {
    const q: Query = await this.getQuery();
    for (const pkey of this._primary_keys) {
      // @ts-ignore
      q.whereOp(pkey, '=', this[pkey]);
    }
    await q.delete();
    this._exists = false;
  }

  /**
   * Refreshes the model by reloading its data from the database.
   *
   * @returns A promise that resolves when the refresh operation is complete
   * @throws Error if the record is not found in the database
   *
   * @example
   * const user = await User.find(1);
   * // ... some time passes and the database record changes
   * await user.refresh(); // Reloads fresh data from database
   */
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

  /**
   * Fills the model attributes and applies mutators to the data.
   *
   * @param r - The data object to fill from
   * @returns A promise that resolves when filling and mutation is complete
   * @internal
   */
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

  /**
   * Finds a model by its primary key (usually ID).
   *
   * @param id - The primary key value to search for
   * @param options - Query options
   * @param options.withGlobalScopes - Whether to apply global scopes (default: true)
   * @returns A promise that resolves to the model instance or undefined if not found
   *
   * @example
   * const user = await User.find(1);
   * if (user) {
   *   console.log(user.name);
   * }
   *
   * @example
   * // Find without global scopes
   * const user = await User.find(1, { withGlobalScopes: false });
   */
  public static async find<T extends typeof BaseModel>(
    id: number,
    options = { withGlobalScopes: true }
  ): Promise<InstanceType<T> | undefined> {
    return this.findByPrimaryKey<T>({ id }, options);
  }

  /**
   * Finds a single model by the given conditions.
   *
   * @param conditions - An object with column-value pairs to match
   * @param options - Query options
   * @param options.withGlobalScopes - Whether to apply global scopes (default: true)
   * @returns A promise that resolves to the model instance or undefined if not found
   *
   * @example
   * const user = await User.findOne({ email: 'john@example.com' });
   *
   * @example
   * const activeUser = await User.findOne(
   *   { email: 'john@example.com', status: 'active' },
   *   { withGlobalScopes: false }
   * );
   */
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
    self._exists = true;
    return self as T;
  }

  /**
   * Finds a model by its primary key or throws an error if not found.
   *
   * @param id - The primary key value to search for
   * @param options - Query options
   * @param options.withGlobalScopes - Whether to apply global scopes (default: true)
   * @returns A promise that resolves to the model instance
   * @throws Error if the model is not found
   *
   * @example
   * try {
   *   const user = await User.findorFail(1);
   *   console.log(user.name);
   * } catch (error) {
   *   console.error('User not found');
   * }
   */
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

  /**
   * Finds a model by its primary key(s). Supports composite primary keys.
   *
   * @param keys - An object with primary key column-value pairs
   * @param options - Query options
   * @param options.withGlobalScopes - Whether to apply global scopes (default: true)
   * @returns A promise that resolves to the model instance or undefined if not found
   *
   * @example
   * // Single primary key
   * const user = await User.findByPrimaryKey({ id: 1 });
   *
   * @example
   * // Composite primary key
   * const userRole = await UserRole.findByPrimaryKey({
   *   user_id: 1,
   *   role_id: 2
   * });
   */
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
    self._exists = true;

    return self;
  }

  /**
   * Sets the database connection for all instances of this model class.
   * Can accept a Connection instance or a factory function.
   *
   * @param conn - The connection instance or factory function
   *
   * @example
   * // Set a specific connection
   * User.setConnection(replicaConnection);
   *
   * @example
   * // Use a connection factory
   * User.setConnection(() => getReadReplicaConnection());
   */
  public static setConnection(conn: Connection | (() => Connection)) {
    BaseModel.connection = conn;
  }

  /**
   * Gets the active database connection for this model class.
   *
   * @returns The Connection instance
   * @throws Error if connection is not defined
   *
   * @example
   * const connection = User.getConnection();
   * await connection.raw('SELECT 1');
   */
  public static getConnection(): Connection {
    if (typeof BaseModel.connection === 'undefined') {
      throw new Error('Connection is not defined');
    } else if (typeof BaseModel.connection === 'function') {
      return BaseModel.connection();
    }
    return BaseModel.connection;
  }

  /**
   * Gets a Query instance for this model instance.
   * Delegates to the static getQuery method.
   *
   * @returns A Query instance configured for this model
   *
   * @example
   * const user = new User();
   * const query = user.getQuery();
   * await query.where('status', 'active').get();
   */
  public getQuery(): ReturnType<typeof BaseModel.getQuery> {
    return (this.constructor as typeof BaseModel).getQuery();
  }

  /**
   * Creates and configures a Query instance for this model class.
   * Automatically applies table name and global scopes.
   *
   * @param options - Query options
   * @param options.withGlobalScopes - Whether to apply global scopes (default: true)
   * @returns A Query instance ready for building queries
   *
   * @example
   * // Get query with global scopes
   * const query = User.getQuery();
   * const users = await query.where('age', '>', 18).get();
   *
   * @example
   * // Get query without global scopes
   * const query = User.getQuery({ withGlobalScopes: false });
   * const allUsers = await query.get();
   */
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

  /**
   * Fills the model instance with data from an object.
   * Only populates primary keys and fillable attributes.
   *
   * @param data - An object with property-value pairs to assign
   *
   * @example
   * const user = new User();
   * user.fill({ name: 'John', email: 'john@example.com' });
   * console.log(user.name); // 'John'
   */
  public fill(data: Record<string, Parameter>) {
    for (const key of [...this._primary_keys, ...this._fillable]) {
      if (key in data) {
        // @ts-ignore
        this[key] = data[key];
      }
    }
  }

  /**
   * Converts the model instance to a plain JSON object.
   * Excludes guarded attributes and formats dates as ISO strings.
   *
   * @returns A plain object representation of the model
   *
   * @example
   * const user = await User.find(1);
   * const json = user.toJson();
   * console.log(json); // { id: 1, name: 'John', created_at: '2024-01-01T00:00:00.000Z' }
   */
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

  /**
   * Creates a new instance of the model with optional initial data.
   *
   * @param initialData - Initial data to populate the instance
   * @param exists - Whether the instance represents an existing database record (default: false)
   * @returns A new model instance
   *
   * @example
   * const user = User.newInstance({ name: 'John' });
   * console.log(user._exists); // false
   *
   * @example
   * // Create instance from existing record
   * const existingUser = User.newInstance({ id: 1, name: 'John' }, true);
   */
  public static newInstance<T extends BaseModel>(
    initialData: any = {},
    exists: boolean = false
  ): T {
    let rc = new this(initialData);
    rc._exists = exists;
    return rc as T;
  }

  /**
   * Creates and saves a new model instance in a single operation.
   *
   * @param initialData - Initial data to populate and save
   * @returns A promise that resolves to the saved model instance
   *
   * @example
   * const user = await User.create({
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * console.log(user.id); // Auto-generated ID
   */
  public static async create<T extends BaseModel>(initialData: any = {}): Promise<T> {
    let rc = new this(initialData);
    await rc.save();
    return rc as T;
  }

  /**
   * Checks if the model or specific attribute(s) have been modified since the last save.
   *
   * @param attribute - Optional. A single attribute name, an array of attribute names, or undefined to check all attributes
   * @returns True if the specified attribute(s) have been modified, false otherwise.
   *          When called without parameters, returns true if any attribute has been modified.
   */
  isDirty(attribute: string | string[] | undefined = undefined): boolean {
    if (Array.isArray(attribute)) {
      return attribute.some((attr) => this._dirties.has(attr));
    }
    if (attribute) {
      return this._dirties.has(attribute);
    }
    return this._dirties.size > 0;
  }
}
