import { sqlTokenizer } from 'sql-tokenizer';
import type { CompiledSql } from './types.mjs';

export class Expression {
  constructor(
    private sql = '',
    private bindings: any[] = []
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
