import { Schema } from './Schema';
import { Query } from './Query';
import { CompiledSql } from './types';

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
}
