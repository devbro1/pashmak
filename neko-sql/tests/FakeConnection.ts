import { Connection } from '../src/Connection.mjs';
import { Schema } from '../src/Schema.mjs';
import { CompiledSql } from '../src/types.mjs';
import { SchemaGrammar } from '../src/SchemaGrammar.mjs';
import { Query } from '../src/Query.mjs';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
import { PostgresqlSchemaGrammar, QueryGrammar } from '../src';

class FakeConnection extends Connection {
  last_sql: CompiledSql = { sql: '', bindings: [] };

  getLastSql(): CompiledSql {
    return this.last_sql;
  }
  async connect(): Promise<boolean> {
    return true;
  }

  async runQuery(sql2: CompiledSql): Promise<any> {
    this.last_sql = sql2;
    return Promise.resolve([]);
  }

  async disconnect(): Promise<boolean> {
    return true;
  }

  getQuery() {
    return new Query(null, new PostgresqlQueryGrammar());
  }

  getSchema() {
    return new Schema(null, new PostgresqlSchemaGrammar());
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

  async createDatabase(name: string): Promise<void> {
    throw new Error('Function not implemented.');
  }

  async dropDatabase(name: string): Promise<void> {
    throw new Error('Function not implemented.');
  }
}

export { FakeConnection };
