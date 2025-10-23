import { Connection, connection_events } from '@devbro/neko-sql';
import { Schema } from '@devbro/neko-sql';
import { CompiledSql } from '@devbro/neko-sql';
import { SchemaGrammar } from '@devbro/neko-sql';
import { Query } from '@devbro/neko-sql';
import { PostgresqlQueryGrammar } from '@devbro/neko-sql';
import { PostgresqlSchemaGrammar, QueryGrammar } from '@devbro/neko-sql';

class FakeConnection extends Connection {
  on(event: connection_events, listener: (...args: any[]) => void): this {
    return this;
  }
  off(event: connection_events, listener: (...args: any[]) => void): this {
    return this;
  }
  emit(event: connection_events, ...args: any[]): Promise<boolean> {
    return Promise.resolve(true);
  }
  isConnected(): boolean {
    return true;
  }

  last_sql: CompiledSql = { sql: '', bindings: [], parts: [] };
  public sqls: CompiledSql[] = [];
  public results: any[] = [];

  getLastSql(): CompiledSql {
    return this.last_sql;
  }

  async connect(): Promise<boolean> {
    return true;
  }

  async runQuery(sql2: CompiledSql): Promise<any> {
    this.last_sql = sql2;
    this.sqls.push(this.last_sql);
    return Promise.resolve(this.results.shift() ?? []);
  }

  async disconnect(): Promise<boolean> {
    return true;
  }

  getQuery() {
    return new Query(this, new PostgresqlQueryGrammar());
  }

  getSchema() {
    return new Schema(this, new PostgresqlSchemaGrammar());
  }

  async beginTransaction(): Promise<void> {
    throw new Error('Function not implemented.');
  }

  async commit(): Promise<void> {
    throw new Error('Function not implemented.');
  }

  async rollback(): Promise<void> {
    throw new Error('Function not implemented.');
  }

  async runCursor(sql: CompiledSql): Promise<any> {
    throw new Error('Function not implemented.');
  }

  getQueryGrammar(): QueryGrammar {
    return new PostgresqlQueryGrammar();
  }

  getSchemaGrammar(): SchemaGrammar {
    return new PostgresqlSchemaGrammar();
  }
}

export { FakeConnection };
