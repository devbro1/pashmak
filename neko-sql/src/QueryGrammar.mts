import { Query } from './Query.mjs';
import {
  Parameter,
  CompiledSql,
  selectType,
  whereNull,
  whereOp,
  whereType,
  whereRaw,
  havingType,
  whereOpColumn,
  joinType,
  whereNested,
} from './types.mjs';
import { sqlTokenizer } from 'sql-tokenizer';

function toUpperFirst(str: string) {
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}
export abstract class QueryGrammar {
  sqlParts: string[] = [
    'select',
    'table',
    'join',
    'where',
    'groupBy',
    'having',
    'orderBy',
    'limit',
    'offset',
  ];

  toSql(query: Query): CompiledSql {
    let rc = this.toSqlParts(query);
    rc.sql = this.joinArray(rc.parts);
    return rc;
  }

  toSqlParts(query: Query): CompiledSql {
    let parts: string[] = [];
    let bindings: Parameter[] = [];

    for (const part of this.sqlParts) {
      // @ts-ignore
      const funcName: keyof this = 'compile' + toUpperFirst(part);
      // @ts-ignore
      const r = this[funcName](query.parts[part]);
      bindings = [...bindings, ...r.bindings];
      parts = [...parts, ...r.parts];
    }

    return {
      sql: '',
      bindings,
      parts,
    };
  }

  compileCount(query: Query): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];
    let parts: (string | number)[] = [];

    for (const part of this.sqlParts) {
      // @ts-ignore
      let parts2 = query.parts[part];
      if (part === 'select') {
        parts2 = ['count(*) as count'];
      }
      // @ts-ignore
      const funcName: keyof this = 'compile' + toUpperFirst(part);
      // @ts-ignore
      const r = this[funcName](parts2);
      bindings = [...bindings, ...r.bindings];
      parts = [...parts, ...r.parts];
    }
    return { sql, parts, bindings };
  }

  compileSelect(selects: selectType[]): CompiledSql {
    const parts = ['select'];
    selects.map((v) => {
      parts.push(v);
      parts.push(',');
    });
    parts.pop();

    return { sql: this.joinArray(parts), parts, bindings: [] };
  }

  joinArray(arr: (string | number)[]): string {
    let rc = '';
    let last: string | number = '';
    for (const a of arr) {
      if (a === ',') {
        rc += a;
      } else if (last === '(' || last === ' ' || a === ')') {
        rc += a;
      } else if (a === '') {
        rc += '';
      } else {
        rc += ' ' + a;
      }
      last = a;
    }

    return rc.trim();
  }

  compileTable(tableName: string): CompiledSql {
    let parts = [];
    if (tableName.length) {
      parts.push('from');
      parts.push(tableName);
    }

    return { sql: parts.join(' '), parts, bindings: [] };
  }

  compileJoin(joins: joinType[]): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];
    let parts: (string | number)[] = [];

    for (const j of joins) {
      let table = '';
      let table_bindings: any[] = [];

      parts.push(j.type);
      parts.push('join');
      if (typeof j.table === 'string') {
        parts.push(j.table);
      } else {
        const subQuery = j.table;
        const { parts: parts2, bindings } = subQuery.toSql();
        parts = [...parts, '(', ...parts2, ')', 'as', subQuery.parts.alias || 'subquery'];
        table_bindings = bindings;
      }

      parts.push('on');

      const where = this.compileWhere(j.conditions);
      const where_parts = where.parts;
      where_parts.shift();
      parts.push('(');
      parts = [...parts, ...where_parts];
      parts.push(')');

      bindings = [...bindings, ...table_bindings, ...where.bindings];
    }

    return { sql, parts, bindings };
  }

  compileWhere(wheres: whereType[]): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];
    let parts: (string | number)[] = [];

    for (const w of wheres) {
      sql += ' ' + w.joinCondition + ' ';
      parts.push(w.joinCondition);
      if (w.negateCondition) {
        sql += 'not ';
        parts.push('not');
      }
      const funcName = 'compileWhere' + toUpperFirst(w.type);
      // @ts-ignore
      const wh = this[funcName](w);
      sql += wh.sql;
      parts = parts.concat(wh.parts);
      bindings = [...bindings, ...wh.bindings];
    }

    if (sql.startsWith(' and ')) {
      sql = 'where ' + sql.substring(' and '.length);
    } else if (sql.startsWith(' or ')) {
      sql = 'where ' + sql.substring(' or '.length);
    }

    if (parts.length > 0) {
      parts[0] = 'where';
    }
    return { sql, parts, bindings };
  }

  compileWhereNested(w: whereNested): CompiledSql {
    const subQuery = w.query;
    let parts: (string | number)[] = [];
    const { sql, parts: parts2, bindings } = subQuery.grammar.compileWhere(subQuery.parts.where);
    let sql2 = sql.replace(/^where /, '');
    parts2.shift();
    parts.push('(');
    parts = parts.concat(parts2);
    parts.push(')');
    return {
      sql: `(${sql2})`,
      parts,
      bindings,
    };
  }

  compileWhereOperation(w: whereOp): CompiledSql {
    if (w.operation.toLowerCase() === 'in' && Array.isArray(w.value)) {
      return {
        sql: `${w.column} = ANY( ? )`,
        parts: [w.column, ' = ANY(', '?', ')'],
        bindings: [w.value],
      };
    }

    return {
      sql: `${w.column} ${w.operation} ?`,
      parts: [w.column, w.operation, '?'],
      bindings: [w.value],
    };
  }

  compileWhereOperationColumn(w: whereOpColumn): CompiledSql {
    return {
      sql: `${w.column1} ${w.operation} ${w.column2}`,
      parts: [w.column1, w.operation, w.column2],
      bindings: [],
    };
  }

  compileWhereRaw(w: whereRaw): CompiledSql {
    const tokenize = sqlTokenizer();

    return {
      sql: w.sql,
      parts: tokenize(w.sql).filter((t: string) => t !== ' '),
      bindings: w.bindings,
    };
  }

  compileOrderBy(orderBy: string[]): CompiledSql {
    let rc = '';
    let parts: (string | number)[] = [];
    if (orderBy.length) {
      rc = 'order by ' + orderBy.join(', ');
      parts.push('order by');
      parts = parts.concat(orderBy);
    }

    return { sql: rc, parts, bindings: [] };
  }

  compileLimit(limit: number | null): CompiledSql {
    let rc = '';
    let parts: (string | number)[] = [];
    if (limit !== null) {
      rc = 'limit ' + limit;
      parts.push('limit');
      parts.push(limit);
    }

    return { sql: rc, parts, bindings: [] };
  }

  compileOffset(offset: number | null): CompiledSql {
    let rc = '';
    let parts: (string | number)[] = [];
    if (offset !== null) {
      rc = 'offset ' + offset;
      parts.push('offset');
      parts.push(offset);
    }

    return { sql: rc, parts, bindings: [] };
  }

  abstract getVariablePlaceholder(): string;

  compileWhereNull(w: whereNull): CompiledSql {
    return {
      sql: `${w.column} is null`,
      parts: [w.column, 'is', 'null'],
      bindings: [],
    };
  }

  compileInsert(query: Query, data: Record<string, Parameter>): CompiledSql {
    let parts = ['insert', 'into', query.parts.table, '('];
    const columns: string[] = [];
    const bindings: Parameter[] = [];
    const values: string[] = [];

    for (const [k, v] of Object.entries(data)) {
      parts.push(k);
      parts.push(',');
    }
    parts.pop();
    parts = parts.concat([')', 'values', '(']);

    for (const [k, v] of Object.entries(data)) {
      parts.push('?');
      bindings.push(v);
      parts.push(',');
    }
    parts.pop();
    parts.push(')');

    return { sql: parts.join(' '), parts, bindings };
  }

  abstract compileInsertGetId(
    query: Query,
    data: Record<string, Parameter>,
    options: { primaryKey: string[] }
  ): CompiledSql;

  compileUpdate(query: Query, data: Record<string, Parameter>): CompiledSql {
    const bindings: Parameter[] = [];
    let parts: (string | number)[] = ['update', query.parts.table, 'set'];

    const setParts = [];
    for (const [k, v] of Object.entries(data)) {
      parts = parts.concat([k, '=', '?', ',']);
      setParts.push(`${k} = ?`);
      bindings.push(v);
    }
    parts.pop();

    const where_csql = this.compileWhere(query.parts.where);
    parts = parts.concat(where_csql.parts);
    bindings.push(...where_csql.bindings);

    return { sql: parts.join(' '), parts, bindings };
  }

  compileDelete(query: Query): CompiledSql {
    let sql = 'delete from ' + query.parts.table;
    let parts: (string | number)[] = ['delete', 'from', query.parts.table];
    const where_csql = this.compileWhere(query.parts.where);
    sql += ' ' + where_csql.sql;
    parts = parts.concat(where_csql.parts);
    return { sql, parts, bindings: where_csql.bindings };
  }

  compileUpsert(
    query: Query,
    data: Record<string, Parameter>,
    conflictFields: string[],
    updateFields: string[]
  ): CompiledSql {
    let parts: (string | number)[] = [];
    const bindings: Parameter[] = [];

    let isql = this.compileInsert(query, data);
    parts = isql.parts;
    bindings.push(...isql.bindings);

    parts = parts.concat(['on', 'conflict', '(', ...conflictFields, ')', 'do', 'update', 'set']);
    const setParts = [];
    for (const f of updateFields) {
      setParts.push(`${f} = excluded.${f}`);
      setParts.push(`,`);
    }
    setParts.pop();
    parts = parts.concat(setParts);

    const where_csql = this.compileWhere(query.parts.where);
    parts = parts.concat(where_csql.parts);
    bindings.push(...where_csql.bindings);

    return { sql: parts.join(' '), parts, bindings };
  }

  compileGroupBy(groupBy: string[]): CompiledSql {
    let rc = '';
    let parts = [];
    if (groupBy.length) {
      rc = 'group by ' + groupBy.join(', ');
      parts.push('group by');
      parts.concat(groupBy);
    }

    return { sql: rc, parts, bindings: [] };
  }

  compileHaving(having: havingType[]): CompiledSql {
    let sql = '';
    let bindings: Parameter[] = [];
    let parts: (string | number)[] = [];

    for (const w of having) {
      sql += ' ' + w.joinCondition + ' ';
      parts.push(w.joinCondition);
      if (w.negateCondition) {
        sql += 'not ';
        parts.push('not');
      }
      const funcName = 'compileHaving' + toUpperFirst(w.type);
      // @ts-ignore
      const wh = this[funcName](w);
      parts.concat(wh.parts);
      sql += wh.sql;
      bindings = [...bindings, ...wh.bindings];
    }

    if (parts.length > 0) {
      parts[0] = 'having';
    }

    return { sql: parts.join(' '), parts, bindings };
  }

  compileHavingOperation(w: whereOp): CompiledSql {
    return {
      sql: `${w.column} ${w.operation} ?`,
      parts: [w.column, w.operation, '?'],
      bindings: [w.value],
    };
  }

  compileHavingRaw(w: whereRaw): CompiledSql {
    return {
      sql: w.sql,
      parts: w.sql.split(' '),
      bindings: w.bindings,
    };
  }
}
