import { table } from 'console';
import { Query } from './Query';
import {
  Parameter,
  CompiledSql,
  selectType,
  whereNull,
  whereOp,
  whereType,
  whereRaw,
} from './types';

function toUpperFirst(str: string) {
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}
export abstract class QueryGrammar {
  sqlParts: string[] = [
    'select',
    'table',
    'where',
    'groupBy',
    'having',
    'orderBy',
    'limit',
    'offset',
  ];

  toSql(query: Query): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];

    for (const part of this.sqlParts) {
      // @ts-ignore
      const funcName: keyof this = 'compile' + toUpperFirst(part);
      // @ts-ignore
      const r = this[funcName](query.parts[part]);
      if (!sql) {
        sql = r.sql;
      } else if (r.sql) {
        sql += ' ' + r.sql;
      }
      bindings = [...bindings, ...r.bindings];
    }
    return { sql, bindings };
  }

  compileSelect(selects: selectType[]): CompiledSql {
    const rc = selects
      .map((v) => {
        return v;
      })
      .join(', ');

    return { sql: 'select ' + rc, bindings: [] };
  }

  compileTable(tableName: string): CompiledSql {
    let rc = '';
    if (tableName.length) {
      rc = 'from ' + tableName;
    }

    return { sql: rc, bindings: [] };
  }

  compileWhere(wheres: whereType[]): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];

    for (const w of wheres) {
      sql += ' ' + w.joinCondition + ' ';
      if (w.negateCondition) {
        sql += 'not ';
      }
      const funcName = 'compileWhere' + toUpperFirst(w.type);
      // @ts-ignore
      const wh = this[funcName](w);
      sql += wh.sql;
      bindings = [...bindings, ...wh.bindings];
    }
    if (sql.startsWith(' and ')) {
      sql = 'where ' + sql.substring(' and '.length);
    } else if (sql.startsWith(' or ')) {
      sql = 'where ' + sql.substring(' or '.length);
    }
    return { sql, bindings };
  }

  compileWhereOperation(w: whereOp): CompiledSql {
    return {
      sql: `${w.column} ${w.operation} ${this.getVariablePlaceholder()}`,
      bindings: [w.value],
    };
  }

  compileOrderBy(orderBy: string[]): CompiledSql {
    let rc = '';
    if (orderBy.length) {
      rc = 'order by ' + orderBy.join(', ');
    }

    return { sql: rc, bindings: [] };
  }

  compileLimit(limit: number | null): CompiledSql {
    let rc = '';
    if (limit !== null) {
      rc = 'limit ' + limit;
    }

    return { sql: rc, bindings: [] };
  }

  compileOffset(offset: number | null): CompiledSql {
    let rc = '';
    if (offset !== null) {
      rc = 'offset ' + offset;
    }

    return { sql: rc, bindings: [] };
  }

  abstract getVariablePlaceholder(): string;

  compileWhereNull(w: whereNull): CompiledSql {
    return {
      sql: `${w.column} is null`,
      bindings: [],
    };
  }

  compileInsert(query: Query, data: Record<string, Parameter>): CompiledSql {
    let sql = 'insert into ' + query.parts.table + ' (';
    const columns: string[] = [];
    const bindings: Parameter[] = [];
    const values: string[] = [];

    for (const [k, v] of Object.entries(data)) {
      columns.push(k);
      bindings.push(v);
      values.push(this.getVariablePlaceholder());
    }

    sql += columns.join(', ') + ') values (' + values + ')';

    return { sql, bindings };
  }

  compileUpdate(query: Query, data: Record<string, Parameter>): CompiledSql {
    let sql = 'update ' + query.parts.table + ' set ';
    const bindings: Parameter[] = [];

    const setParts = [];
    for (const [k, v] of Object.entries(data)) {
      setParts.push(`${k} = ${this.getVariablePlaceholder()}`);
      bindings.push(v);
    }

    sql += setParts.join(', ');

    const where_csql = this.compileWhere(query.parts.where);
    sql += ' ' + where_csql.sql;
    bindings.push(...where_csql.bindings);

    return { sql, bindings };
  }

  compileDelete(query: Query): CompiledSql {
    let sql = 'delete from ' + query.parts.table;
    const where_csql = this.compileWhere(query.parts.where);
    sql += ' ' + where_csql.sql;
    return { sql, bindings: where_csql.bindings };
  }

  compileUpsert(
    query: Query,
    data: Record<string, Parameter>,
    conflictFields: string[],
    updateFields: string[]
  ): CompiledSql {
    let sql = 'insert into ' + query.parts.table + ' (';
    const columns: string[] = [];
    const bindings: Parameter[] = [];
    const values: string[] = [];

    for (const [k, v] of Object.entries(data)) {
      columns.push(k);
      bindings.push(v);
      values.push(this.getVariablePlaceholder());
    }

    sql += columns.join(', ') + ') values (' + values + ')';

    sql += ' on conflict (' + conflictFields.join(', ') + ') do update set ';
    const setParts = [];
    for (const f of updateFields) {
      setParts.push(`${f} = excluded.${f}`);
    }
    sql += setParts.join(', ');

    const where_csql = this.compileWhere(query.parts.where);
    sql += ' ' + where_csql.sql;
    bindings.push(...where_csql.bindings);

    return { sql, bindings };
  }

  compileGroupBy(groupBy: string[]): CompiledSql {
    let rc = '';
    if (groupBy.length) {
      rc = 'group by ' + groupBy.join(', ');
    }

    return { sql: rc, bindings: [] };
  }

  compileHaving(having: whereType[]): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];

    for (const w of having) {
      sql += ' ' + w.joinCondition + ' ';
      if (w.negateCondition) {
        sql += 'not ';
      }
      const funcName = 'compileHaving' + toUpperFirst(w.type);
      // @ts-ignore
      const wh = this[funcName](w);
      sql += wh.sql;
      bindings = [...bindings, ...wh.bindings];
    }
    if (sql.startsWith(' and ')) {
      sql = 'having ' + sql.substring(' and '.length);
    } else if (sql.startsWith(' or ')) {
      sql = 'having ' + sql.substring(' or '.length);
    }
    return { sql, bindings };
  }

  compileHavingOperation(w: whereOp): CompiledSql {
    return {
      sql: `${w.column} ${w.operation} ${this.getVariablePlaceholder()}`,
      bindings: [w.value],
    };
  }

  compileHavingRaw(w: whereRaw): CompiledSql {
    return {
      sql: w.sql,
      bindings: w.bindings,
    };
  }
}
