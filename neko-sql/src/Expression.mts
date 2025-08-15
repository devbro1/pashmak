import { CompiledSql } from './types.mjs';

export class Expression {
  constructor(
    private sql = '',
    private bindings = []
  ) {}

  toCompiledSql(): CompiledSql {
    return { sql: this.sql, bindings: this.bindings };
  }
}
