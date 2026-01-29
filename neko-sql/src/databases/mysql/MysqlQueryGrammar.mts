import { Query } from '../../Query.mjs';
import { QueryGrammar } from '../../QueryGrammar.mjs';
import { CompiledSql } from '../../types.mjs';

export class MysqlQueryGrammar extends QueryGrammar {
  compileInsertGetId(
    query: Query,
    data: Record<string, any> | Record<string, any>[],
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ): CompiledSql {
    return super.compileInsert(query, data);
  }

  postProcessGetInsertId(result: any) {
    return [{id: result.insertId}];
  }
}
