import { Schema } from './Schema.mjs';
import { Query } from './Query.mjs';
import { CompiledSql } from './types.mjs';
import { QueryGrammar } from './QueryGrammar.mjs';
import { SchemaGrammar } from './SchemaGrammar.mjs';

export abstract class Connection {
  abstract connect(): Promise<boolean>;
  abstract runQuery(sql: CompiledSql): Promise<any>;
  abstract runCursor(sql: CompiledSql): Promise<any>;
  abstract disconnect(): Promise<boolean>;
  abstract getQuery(): Query;
  abstract getSchema(): Schema;
  abstract beginTransaction(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  abstract getQueryGrammar(): QueryGrammar;
  abstract getSchemaGrammar(): SchemaGrammar;
}
