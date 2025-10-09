import { CompiledSql } from './types.mjs';
// @ts-ignore - no type definitions available for sql-tokenizer
import { sqlTokenizer } from 'sql-tokenizer';

export class Expression {
  constructor(
    private sql = '',
    private bindings = []
  ) {}

  toCompiledSql(): CompiledSql {
    const tokenize = sqlTokenizer(this.sql);
    return { sql: this.sql, bindings: this.bindings, parts: tokenize(this.sql) };
  }
}
