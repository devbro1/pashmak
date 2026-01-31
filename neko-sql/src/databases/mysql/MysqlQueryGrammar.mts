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
    let rc = [];
    for (let i = 0; i < result.affectedRows; i++) {
      rc.push({ id: result.insertId + i });
    }
    return rc;
  }
}
