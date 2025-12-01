import { connection_events, Connection as ConnectionAbs } from '../../Connection.mjs';
import Database from 'better-sqlite3';
import { CompiledSql } from '../../types.mjs';
import { Query } from '../../Query.mjs';
import { SqliteQueryGrammar } from './SqliteQueryGrammar.mjs';
import { Schema } from '../../Schema.mjs';
import { SqliteSchemaGrammar } from './SqliteSchemaGrammar.mjs';
import { EventManager } from '@devbro/neko-helper';

export interface SqliteConfig {
  filename: string;
  readonly?: boolean;
  fileMustExist?: boolean;
  timeout?: number;
  verbose?: (message?: unknown, ...additionalArgs: unknown[]) => void;
}

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

  static defaults: Partial<SqliteConfig> = {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
  };

  constructor(params: SqliteConfig) {
    super();
    this.config = { ...SqliteConnection.defaults, ...params } as SqliteConfig;
  }

  async connect(): Promise<boolean> {
    this.eventManager.emit('connect');
    this.connection = new Database(this.config.filename, {
      readonly: this.config.readonly,
      fileMustExist: this.config.fileMustExist,
      timeout: this.config.timeout,
      verbose: this.config.verbose,
    });
    return true;
  }

  async runQuery(sql: CompiledSql | string): Promise<any> {
    if (typeof sql === 'string') {
      sql = { sql: sql, bindings: [], parts: [sql] };
    }

    this.eventManager.emit('query', { sql: sql.sql, bindings: sql.bindings });

    if (!this.isConnected()) {
      await this.connect();
    }

    try {
      const stmt = this.connection!.prepare(sql.sql);
      
      // Check if the query is a SELECT or returns data
      if (sql.sql.trim().toUpperCase().startsWith('SELECT') || 
          sql.sql.trim().toUpperCase().startsWith('RETURNING')) {
        return stmt.all(...sql.bindings);
      } else {
        const result = stmt.run(...sql.bindings);
        return result;
      }
    } catch (error) {
      this.eventManager.emit('error', error);
      throw error;
    }
  }

  async runCursor(sql: CompiledSql): Promise<any> {
    // SQLite doesn't have native cursor support, return iterator
    if (!this.isConnected()) {
      await this.connect();
    }
    const stmt = this.connection!.prepare(sql.sql);
    return stmt.iterate(...sql.bindings);
  }

  async disconnect(): Promise<boolean> {
    if (this.connection === undefined) {
      return true;
    }
    this.connection.close();
    this.connection = undefined;
    this.eventManager.emit('disconnect');
    return true;
  }

  getQuery(): Query {
    return new Query(this, new SqliteQueryGrammar());
  }

  getSchema(): Schema {
    return new Schema(this, new SqliteSchemaGrammar());
  }

  getQueryGrammar(): SqliteQueryGrammar {
    return new SqliteQueryGrammar();
  }

  getSchemaGrammar(): SqliteSchemaGrammar {
    return new SqliteSchemaGrammar();
  }

  async beginTransaction(): Promise<void> {
    await this.runQuery({ sql: 'BEGIN TRANSACTION', bindings: [], parts: ['BEGIN', 'TRANSACTION'] });
  }

  async commit(): Promise<void> {
    await this.runQuery({ sql: 'COMMIT', bindings: [], parts: ['COMMIT'] });
  }

  async rollback(): Promise<void> {
    await this.runQuery({ sql: 'ROLLBACK', bindings: [], parts: ['ROLLBACK'] });
  }

  isConnected(): boolean {
    return this.connection !== undefined && this.connection.open;
  }

  /**
   * Validates and escapes a SQLite identifier (database name, table name, etc.)
   * Uses a whitelist approach to ensure only safe characters are allowed
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

  async createDatabase(name: string): Promise<void> {
    // SQLite databases are files, creating a database means creating a new connection
    const safeName = this.validateAndEscapeIdentifier(name);
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    const tempDb = new Database(dbPath);
    tempDb.close();
  }

  async dropDatabase(name: string): Promise<void> {
    // SQLite databases are files, dropping means deleting the file
    const safeName = this.validateAndEscapeIdentifier(name);
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    const fs = await import('fs');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  }

  async listDatabases(): Promise<string[]> {
    // SQLite doesn't have a concept of multiple databases in the same connection
    // This would require listing files in a directory
    return [this.config.filename];
  }

  async existsDatabase(name: string): Promise<boolean> {
    const dbPath = name.endsWith('.db') ? name : `${name}.db`;
    const fs = await import('fs');
    return fs.existsSync(dbPath);
  }
}
