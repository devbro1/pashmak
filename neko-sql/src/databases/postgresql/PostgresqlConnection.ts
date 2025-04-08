import { Connection as ConnectionAbs } from '../../Connection';
import { Connection, PoolClient, PoolConfig } from 'pg';
import { Pool } from 'pg';
import { CompiledSql } from '../../types';
import { Query } from '../../Query';
import { PostgresqlQueryGrammar } from './PostgresqlQueryGrammar';
export class PostgresqlConnection extends ConnectionAbs {
  connection: PoolClient | undefined;
  static pool: Pool;

  constructor(params: PoolConfig) {
    super();
    if (!PostgresqlConnection.pool) {
      const defaults: PoolConfig = {
        port: 5432,
        ssl: false,
        max: 20,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 1000,
        maxUses: 7500,
      };
      PostgresqlConnection.pool = new Pool({ ...defaults, ...params });
    }
  }
  async connect(): Promise<boolean> {
    this.connection = await PostgresqlConnection.pool.connect();
    return true;
  }
  async runQuery(sql: CompiledSql) {
    const result = await this.connection?.query(sql.sql, sql.bindings);
    return result?.rows;
  }
  async disconnect(): Promise<boolean> {
    await this.connection?.release();
    return true;
  }

  getQuery(): Query {
    return new Query(this, new PostgresqlQueryGrammar());
  }
}
