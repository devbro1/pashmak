import { Query } from '../../Query.mjs';
import { QueryGrammar } from '../../QueryGrammar.mjs';
import { CompiledSql } from '../../types.mjs';

export class MysqlQueryGrammar extends QueryGrammar {
  compileInsertGetId(
    query: Query,
    data: Record<string, any>,
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ): CompiledSql {
    // MySQL uses LAST_INSERT_ID() to get the auto-increment value
    // We'll compile the insert normally and handle the ID retrieval in the connection
    return super.compileInsert(query, data);
  }
}
