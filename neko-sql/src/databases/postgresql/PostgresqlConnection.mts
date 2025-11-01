import { connection_events, Connection as ConnectionAbs } from '../../Connection.mjs';
import { Connection, PoolClient, PoolConfig } from 'pg';
import { Pool } from 'pg';
import { CompiledSql } from '../../types.mjs';
import { Query } from '../../Query.mjs';
import { PostgresqlQueryGrammar } from './PostgresqlQueryGrammar.mjs';
import { Schema } from '../../Schema.mjs';
import { PostgresqlSchemaGrammar } from './PostgresqlSchemaGrammar.mjs';
import Cursor from 'pg-cursor';
import { EventManager } from '@devbro/neko-helper';

export class PostgresqlConnection extends ConnectionAbs {
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

  connection: PoolClient | undefined;
  static pool: Pool;

  static defaults: PoolConfig = {
    port: 5432,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 1, // wait X milli seconds before closing an idle/released connection
    connectionTimeoutMillis: 30000, // wait up to 30 seconds to obtain a new connection
    maxUses: 7500,
  };

  constructor(params: PoolConfig) {
    super();
    if (!PostgresqlConnection.pool) {
      PostgresqlConnection.pool = new Pool({ ...PostgresqlConnection.defaults, ...params });
    }
  }
  async connect(): Promise<boolean> {
    this.eventManager.emit('connect');
    this.connection = await PostgresqlConnection.pool.connect();
    return true;
  }
  async runQuery(sql: CompiledSql) {
    let counter = 1;
    let sql2 = sql.sql;
    if (sql.parts && sql.parts.length > 0) {
      sql2 = sql.parts.map((v) => (v === '?' ? '$' + counter++ : v)).join(' ');
    }

    this.eventManager.emit('query', { sql: sql2, bindings: sql.bindings });

    if (!this.isConnected()) {
      await this.connect();
    }
    const result = await this.connection!.query(sql2, sql.bindings);
    return result?.rows;
  }

  async runCursor(sql: CompiledSql): Promise<any> {
    return this.connection?.query(new Cursor(sql.sql, sql.bindings));
  }

  async disconnect(): Promise<boolean> {
    if (this.connection === undefined) {
      return true;
    }
    await this.connection?.release();
    this.connection = undefined;
    this.eventManager.emit('disconnect');
    return true;
  }

  getQuery(): Query {
    return new Query(this, new PostgresqlQueryGrammar());
  }

  getSchema(): Schema {
    return new Schema(this, new PostgresqlSchemaGrammar());
  }

  getQueryGrammar(): PostgresqlQueryGrammar {
    return new PostgresqlQueryGrammar();
  }
  getSchemaGrammar(): PostgresqlSchemaGrammar {
    return new PostgresqlSchemaGrammar();
  }

  async beginTransaction(): Promise<void> {
    await this.runQuery({ sql: 'BEGIN', bindings: [], parts: ['BEGIN'] });
  }

  async commit(): Promise<void> {
    await this.runQuery({ sql: 'COMMIT', bindings: [], parts: ['COMMIT'] });
  }

  async rollback(): Promise<void> {
    await this.runQuery({ sql: 'ROLLBACK', bindings: [], parts: ['ROLLBACK'] });
  }

  static async destroy(): Promise<void> {
    PostgresqlConnection.pool.end();
    return;
  }

  isConnected(): boolean {
    return this.connection !== undefined;
  }

  /**
   * Validates and escapes a PostgreSQL identifier (database name, table name, etc.)
   * Uses a whitelist approach to ensure only safe characters are allowed
   */
  private validateAndEscapeIdentifier(name: string): string {
    // PostgreSQL identifiers can contain: letters, digits, underscores, and dollar signs
    // They must start with a letter or underscore
    const validIdentifierPattern = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;

    if (!validIdentifierPattern.test(name)) {
      throw new Error(
        `Invalid identifier: "${name}". Identifiers must start with a letter or underscore and contain only letters, digits, underscores, and dollar signs.`
      );
    }

    // PostgreSQL reserved keywords that should be quoted
    const reservedKeywords = new Set([
      'user',
      'table',
      'database',
      'order',
      'group',
      'select',
      'insert',
      'update',
      'delete',
    ]);

    // Quote the identifier if it's a reserved keyword or contains uppercase letters
    if (reservedKeywords.has(name.toLowerCase()) || name !== name.toLowerCase()) {
      // Escape any double quotes in the name
      const escapedName = name.replace(/"/g, '""');
      return `"${escapedName}"`;
    }

    return name;
  }

  async createDatabase(name: string): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
    const safeName = this.validateAndEscapeIdentifier(name);
    await this.connection!.query(`CREATE DATABASE ${safeName}`);
  }

  async dropDatabase(name: string): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
    const safeName = this.validateAndEscapeIdentifier(name);
    await this.connection!.query(`DROP DATABASE ${safeName}`);
  }
}
