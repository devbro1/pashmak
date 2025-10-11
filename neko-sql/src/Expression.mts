import { CompiledSql } from './types.mjs';
// @ts-ignore - no type definitions available for sql-tokenizer
import { sqlTokenizer } from 'sql-tokenizer';

export class Expression {
  constructor(
    private sql = '',
    private bindings = []
  ) {}

  toCompiledSql(): CompiledSql {
    let parts = [];
    try {
      const tokenize = sqlTokenizer();
      parts = tokenize(this.sql);
    } catch (error) {
      console.error('Error tokenizing SQL:', error);
      parts = [this.sql];
    }
    return { sql: this.sql, bindings: this.bindings, parts };
  }
}
