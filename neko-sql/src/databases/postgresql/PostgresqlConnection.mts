import { Connection as ConnectionAbs } from '../../Connection.mjs';
import { Connection, PoolClient, PoolConfig } from 'pg';
import { Pool } from 'pg';
import { CompiledSql } from '../../types.mjs';
import { Query } from '../../Query.mjs';
import { PostgresqlQueryGrammar } from './PostgresqlQueryGrammar.mjs';
import { Schema } from '../../Schema.mjs';
import { PostgresqlSchemaGrammar } from './PostgresqlSchemaGrammar.mjs';
import Cursor from 'pg-cursor';

export class PostgresqlConnection extends ConnectionAbs {
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
    this.connection = await PostgresqlConnection.pool.connect();
    return true;
  }
  async runQuery(sql: CompiledSql) {
    let counter = 1;
    let sql2 = sql.parts.map((v) => (v === '?' ? '$' + counter++ : v)).join(' ');
    console.log(sql2, sql.bindings);
    const result = await this.connection?.query(sql2, sql.bindings);
    return result?.rows;
  }

  async runCursor(sql: CompiledSql): Promise<any> {
    return this.connection?.query(new Cursor(sql.sql, sql.bindings));
  }

  async disconnect(): Promise<boolean> {
    await this.connection?.release();
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
    if (!this.connection) {
      throw new Error('No active connection to begin a transaction.');
    }
    await this.connection.query('BEGIN');
  }

  async commit(): Promise<void> {
    if (!this.connection) {
      throw new Error('No active connection to commit a transaction.');
    }
    await this.connection.query('COMMIT');
  }

  async rollback(): Promise<void> {
    if (!this.connection) {
      throw new Error('No active connection to rollback a transaction.');
    }
    await this.connection.query('ROLLBACK');
  }

  static async destroy(): Promise<void> {
    PostgresqlConnection.pool.end();
    return;
  }
}
