import { Schema } from './Schema.mjs';
import { Query } from './Query.mjs';
import { CompiledSql } from './types.mjs';
import { QueryGrammar } from './QueryGrammar.mjs';
import { SchemaGrammar } from './SchemaGrammar.mjs';
import { EventEmittor } from '@devbro/neko-helper';

export type connection_events = 'connect' | 'disconnect' | 'query' | 'error';
export abstract class Connection implements EventEmittor<connection_events[]> {
  abstract on(event: connection_events, listener: (...args: any[]) => void): this;
  abstract off(event: connection_events, listener: (...args: any[]) => void): this;
  abstract emit(event: connection_events, ...args: any[]): Promise<boolean>;

  abstract isConnected(): boolean;
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
