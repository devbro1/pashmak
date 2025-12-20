import { Query } from '../../Query.mjs';
import { QueryGrammar } from '../../QueryGrammar.mjs';
import { CompiledSql, Parameter } from '../../types.mjs';

export class MysqlQueryGrammar extends QueryGrammar {
  constructor() {
    super();
  }

  toSql(query: Query): CompiledSql {
    return super.toSql(query);
  }

  compileInsert(query: Query, data: Record<string, any>): CompiledSql {
    return super.compileInsert(query, data);
  }

  compileInsertGetId(
    query: Query,
    data: Record<string, any>,
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ): CompiledSql {
    // MySQL uses LAST_INSERT_ID() to get the auto-increment value
    // We'll compile the insert normally and handle the ID retrieval in the connection
    return super.compileInsert(query, data);
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
