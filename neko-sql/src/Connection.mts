import type { EventEmittor } from '@devbro/neko-helper';
import type { Query } from './Query.mjs';
import type { QueryGrammar } from './QueryGrammar.mjs';
import type { Schema } from './Schema.mjs';
import type { SchemaGrammar } from './SchemaGrammar.mjs';
import type { CompiledSql } from './types.mjs';

export type connection_events = 'connect' | 'disconnect' | 'query' | 'error';
export abstract class Connection implements EventEmittor<connection_events[]> {
  abstract on(event: connection_events, listener: (...args: any[]) => void): this;
  abstract off(event: connection_events, listener: (...args: any[]) => void): this;
  abstract emit(event: connection_events, ...args: any[]): Promise<boolean>;

  abstract isConnected(): boolean;
  abstract connect(): Promise<boolean>;
  abstract runQuery(sql: CompiledSql | string): Promise<any>;
  abstract runCursor(sql: CompiledSql): Promise<any>;
  abstract disconnect(): Promise<boolean>;
  abstract getQuery(): Query;
  abstract getSchema(): Schema;
  abstract beginTransaction(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  abstract getQueryGrammar(): QueryGrammar;
  abstract getSchemaGrammar(): SchemaGrammar;
  abstract createDatabase(name: string): Promise<void>;
  abstract dropDatabase(name: string): Promise<void>;
  abstract listDatabases(): Promise<string[]>;
  abstract existsDatabase(name: string): Promise<boolean>;
}
