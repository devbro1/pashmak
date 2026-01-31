import { Query } from '../../Query.mjs';
import { QueryGrammar } from '../../QueryGrammar.mjs';
import { CompiledSql, Parameter } from '../../types.mjs';
import { Arr } from '@devbro/neko-helper';
export class PostgresqlQueryGrammar extends QueryGrammar {
  constructor() {
    super();
  }

  toSql(query: Query): CompiledSql {
    return super.toSql(query);
  }

  compileInsert(query: Query, data: Record<string, any> | Record<string, any>[]): CompiledSql {
    return super.compileInsert(query, data);
  }

  compileInsertGetId(
    query: Query,
    data: Record<string, any> | Record<string, any>[],
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ): CompiledSql {
    const rc = super.compileInsert(query, data);
    rc.sql += ` RETURNING ${options.primaryKey.join(', ')}`;
    rc.parts = rc.parts.concat(['RETURNING', ...Arr.intersperse(options.primaryKey, ',')]);
    return rc;
  }

  compileUpdate(query: Query, data: Record<string, any>): CompiledSql {
    return super.compileUpdate(query, data);
  }

  compileDelete(query: Query): CompiledSql {
    return super.compileDelete(query);
  }

  compileUpsert(
    query: Query,
    data: Record<string, Parameter>,
    conflictFields: string[],
    updateFields: string[]
  ): CompiledSql {
    return super.compileUpsert(query, data, conflictFields, updateFields);
  }

  compileCount(query: Query): CompiledSql {
    return super.compileCount(query);
  }
}
