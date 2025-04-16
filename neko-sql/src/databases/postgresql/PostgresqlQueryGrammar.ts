import { Query } from '../../Query';
import { QueryGrammar } from '../../QueryGrammar';
import { CompiledSql, Parameter } from '../../types';

export class PostgresqlQueryGrammar extends QueryGrammar {
  private parameterIndex: number;
  constructor() {
    super();
    this.parameterIndex = 1;
  }

  toSql(query: Query): CompiledSql {
    this.parameterIndex = 1;
    return super.toSql(query);
  }

  getVariablePlaceholder(): string {
    return '$' + this.parameterIndex++;
  }

  compileInsert(query: Query, data: Record<string, any>): CompiledSql {
    this.parameterIndex = 1;
    return super.compileInsert(query, data);
  }

  compileInsertGetId(
    query: Query,
    data: Record<string, any>,
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ): CompiledSql {
    this.parameterIndex = 1;
    const rc = super.compileInsert(query, data);
    rc.sql += ` RETURNING ${options.primaryKey.join(', ')}`;
    return rc;
  }

  compileUpdate(query: Query, data: Record<string, any>): CompiledSql {
    this.parameterIndex = 1;
    return super.compileUpdate(query, data);
  }

  compileDelete(query: Query): CompiledSql {
    this.parameterIndex = 1;
    return super.compileDelete(query);
  }

  compileUpsert(
    query: Query,
    data: Record<string, Parameter>,
    conflictFields: string[],
    updateFields: string[]
  ): CompiledSql {
    this.parameterIndex = 1;
    return super.compileUpsert(query, data, conflictFields, updateFields);
  }
}
