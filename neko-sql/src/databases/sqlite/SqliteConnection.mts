import { connection_events, Connection as ConnectionAbs } from '../../Connection.mjs';
import type Database from 'better-sqlite3';
import { CompiledSql } from '../../types.mjs';
import { Query } from '../../Query.mjs';
import { SqliteQueryGrammar } from './SqliteQueryGrammar.mjs';
import { Schema } from '../../Schema.mjs';
import { SqliteSchemaGrammar } from './SqliteSchemaGrammar.mjs';
import { EventManager } from '@devbro/neko-helper';
import * as fs from 'fs';
import { loadPackage } from '../../helper.mjs';

/**
 * Configuration options for SQLite database connection
 */
export interface SqliteConfig {
  /** Path to the SQLite database file */
  filename: string;
  /** Open the database in read-only mode (default: false) */
  readonly?: boolean;
  /** Throw an error if the database file doesn't exist (default: false) */
  fileMustExist?: boolean;
  /** Timeout in milliseconds for database operations (default: 5000) */
  timeout?: number;
  /** Optional verbose logging function for debugging SQL statements */
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
}

/**
 * SQLite database connection implementation
 *
 * Provides a connection to SQLite databases using better-sqlite3.
 * Supports transactions, queries, schema operations, and database management.
 */
export class SqliteConnection extends ConnectionAbs {
  private eventManager = new EventManager();

  on(event: connection_events, listener: (...args: any[]) => void): this {
    this.eventManager.on(event, listener);
    return this;
  }
  off(event: connection_events, listener: (...args: any[]) => void): this {
    this.eventManager.off(event, listener);
    return this;
  }
  emit(event: connection_events, ...args: any[]): Promise<boolean> {
    return this.eventManager.emit(event, ...args);
  }

  connection: Database.Database | undefined;
  private config: SqliteConfig;

  /** Default configuration values for SQLite connections */
  static defaults: Partial<SqliteConfig> = {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
  };

  constructor(params: SqliteConfig) {
    super();
    if (!SqliteConnection.sqlite) {
      SqliteConnection.sqlite = loadPackage('better-sqlite3');
    }
    this.config = { ...SqliteConnection.defaults, ...params } as SqliteConfig;
  }

  static sqlite: typeof Database;

  /**
   * Establishes a connection to the SQLite database
   * Creates or opens the database file specified in the configuration
   */
  async connect(): Promise<boolean> {
    this.eventManager.emit('connect').catch(() => {});
    this.connection = new SqliteConnection.sqlite(this.config.filename, {
      readonly: this.config.readonly,
      fileMustExist: this.config.fileMustExist,
      timeout: this.config.timeout,
      verbose: this.config.verbose,
    });
    return true;
  }

  /**
   * Executes a SQL query against the database
   * Automatically detects SELECT queries and queries with RETURNING clauses
   *
   * @param sql - Compiled SQL or raw SQL string to execute
   * @returns Query results (rows for SELECT, run info for INSERT/UPDATE/DELETE)
   */
  async runQuery(sql: CompiledSql | string): Promise<any> {
    if (typeof sql === 'string') {
      sql = { sql: sql, bindings: [], parts: [sql] };
    }

    this.eventManager.emit('query', { sql: sql.sql, bindings: sql.bindings }).catch(() => {});

    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const stmt = this.connection!.prepare(sql.sql);

      // Check if the query is a SELECT or contains RETURNING clause
      const sqlUpper = sql.sql.trim().toUpperCase();
      if (sqlUpper.startsWith('SELECT') || sqlUpper.includes('RETURNING')) {
        return stmt.all(...sql.bindings);
      } else {
        const result = stmt.run(...sql.bindings);
        return result;
      }
    } catch (error) {
      this.eventManager.emit('error', error).catch(() => {});
      throw error;
    }
  }

  /**
   * Executes a query and returns an iterator for streaming results
   * Useful for large result sets to avoid loading all rows into memory
   *
   * @param sql - Compiled SQL to execute
   * @returns Iterator over query results
   */
  async runCursor(sql: CompiledSql): Promise<any> {
    // SQLite doesn't have native cursor support, return iterator
    if (!this.isConnected()) {
      await this.connect();
    }
    const stmt = this.connection!.prepare(sql.sql);
    return stmt.iterate(...sql.bindings);
  }

  /**
   * Closes the database connection
   */
  async disconnect(): Promise<boolean> {
    if (this.connection === undefined) {
      return true;
    }
    this.connection.close();
    this.connection = undefined;
    this.eventManager.emit('disconnect').catch(() => {});
    return true;
  }

  /**
   * Creates a new query builder instance for this connection
   */
  getQuery(): Query {
    return new Query(this, new SqliteQueryGrammar());
  }

  /**
   * Creates a new schema builder instance for this connection
   */
  getSchema(): Schema {
    return new Schema(this, new SqliteSchemaGrammar());
  }

  /**
   * Gets the query grammar for building SQL statements
   */
  getQueryGrammar(): SqliteQueryGrammar {
    return new SqliteQueryGrammar();
  }

  /**
   * Gets the schema grammar for building DDL statements
   */
  getSchemaGrammar(): SqliteSchemaGrammar {
    return new SqliteSchemaGrammar();
  }

  /**
   * Starts a new database transaction
   */
  async beginTransaction(): Promise<void> {
    await this.runQuery({
      sql: 'BEGIN TRANSACTION',
      bindings: [],
      parts: ['BEGIN', 'TRANSACTION'],
    });
  }

  /**
   * Commits the current transaction
   */
  async commit(): Promise<void> {
    await this.runQuery({ sql: 'COMMIT', bindings: [], parts: ['COMMIT'] });
  }

  /**
   * Rolls back the current transaction
   */
  async rollback(): Promise<void> {
    await this.runQuery({ sql: 'ROLLBACK', bindings: [], parts: ['ROLLBACK'] });
  }

  /**
   * Checks if the database connection is active
   */
  isConnected(): boolean {
    return this.connection !== undefined && this.connection.open;
  }

  /**
   * Validates and escapes a SQLite identifier (database name, table name, etc.)
   * Uses a whitelist approach to ensure only safe characters are allowed
   *
   * @param name - The identifier to validate and escape
   * @returns The escaped identifier, quoted if it's a reserved keyword
   * @throws Error if the identifier contains invalid characters
   */
  private validateAndEscapeIdentifier(name: string): string {
    // SQLite identifiers can contain: letters, digits, underscores
    // They must start with a letter or underscore
    const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

    if (!validIdentifierPattern.test(name)) {
      throw new Error(
        `Invalid identifier: "${name}". Identifiers must start with a letter or underscore and contain only letters, digits, and underscores.`
      );
    }

    // SQLite reserved keywords that should be quoted
    const reservedKeywords = new Set([
      'table',
      'database',
      'order',
      'group',
      'select',
      'insert',
      'update',
      'delete',
      'index',
      'from',
      'where',
    ]);

    // Quote the identifier if it's a reserved keyword
    if (reservedKeywords.has(name.toLowerCase())) {
      // Escape any double quotes in the name
      const escapedName = name.replace(/"/g, '""');
      return `"${escapedName}"`;
    }

    return name;
  }

  /**
   * Creates a new SQLite database file
   *
   * @param name - Name or path of the database file to create
   */
  async createDatabase(name: string): Promise<void> {
    // SQLite databases are files, creating a database means creating a new connection
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    const tempDb = new SqliteConnection.sqlite(dbPath);
    tempDb.close();
  }

  /**
   * Deletes a SQLite database file
   *
   * @param name - Name or path of the database file to delete
   */
  async dropDatabase(name: string): Promise<void> {
    // SQLite databases are files, dropping means deleting the file
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  }

  /**
   * Lists available databases
   * For SQLite, this returns the current database filename
   *
   * @returns Array containing the current database filename
   */
  async listDatabases(): Promise<string[]> {
    // SQLite doesn't have a concept of multiple databases in the same connection
    // This would require listing files in a directory
    return [this.config.filename];
  }

  /**
   * Checks if a database file exists
   *
   * @param name - Name or path of the database file to check
   * @returns True if the database file exists, false otherwise
   */
  async existsDatabase(name: string): Promise<boolean> {
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    return fs.existsSync(dbPath);
  }
}
