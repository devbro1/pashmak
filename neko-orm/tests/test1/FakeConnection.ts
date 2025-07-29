import { Connection } from '@devbro/neko-sql';
import { Schema } from '@devbro/neko-sql';
import { CompiledSql } from '@devbro/neko-sql';
import { SchemaGrammar } from '@devbro/neko-sql';
import { Query } from '@devbro/neko-sql';
import { PostgresqlQueryGrammar } from '@devbro/neko-sql';
import { PostgresqlSchemaGrammar, QueryGrammar } from '@devbro/neko-sql';

class FakeConnection extends Connection {
  last_sql: CompiledSql = { sql: '', bindings: [] };
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
    console.log('SQL:', this.last_sql.sql, 'Bindings:', this.last_sql.bindings);
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
    throw new Error('Function not implemented.');
  }

  getSchemaGrammar(): SchemaGrammar {
    throw new Error('Function not implemented.');
  }
}

export { FakeConnection };
