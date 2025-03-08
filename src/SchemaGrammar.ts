import { Blueprint, Column } from './Blueprint';
import { Parameter } from './types';

export class SchemaGrammar {
  toSql(blueprint: Blueprint): string {
    let sql = 'create table ' + blueprint.tableName + ' (';
    const columns = blueprint.columns
      .map((v: Column) => {
        return this.compileColumn(v);
      })
      .join(', ');

    const primaryKeys = this.compilePrimaryKeys(blueprint.primaryKeys);
    sql += [columns, primaryKeys].join(',') + ')';
    return sql;
  }

  compileColumn(column: Column): string {
    const rc = [`${column.columnName}`];

    if (column.properties.type === 'string') {
      rc.push('varchar(' + column.properties.length + ')');
    } else if (column.properties.type === 'char') {
      rc.push('char');
    } else if (column.properties.type === 'boolean') {
      rc.push('boolean');
    } else if (column.properties.type === 'integer') {
      rc.push('integer');
    } else if (column.properties.type === 'text') {
      rc.push('text');
    } else if (column.properties.type === 'timestamp') {
      rc.push('timestamp');
    } else if (column.properties.type === 'serial') {
      rc.push('serial');
    } else if (column.properties.type === 'float') {
      rc.push('float');
    } else if (column.properties.type === 'double') {
      rc.push('double precision');
    } else if (column.properties.type === 'date') {
      rc.push('date');
    } else {
      throw new Error('Unknown column type: ' + column.properties.type);
    }

    if (column.properties.nullable) {
      rc.push('null');
    } else {
      rc.push('not null');
    }

    if (column.properties.unique) {
      rc.push('unique');
    }

    if (column.properties.default !== null) {
      rc.push('default ' + this.escape(column.properties.default));
    }

    return rc.join(' ');
  }

  escape(value: Parameter): string {
    if (value === null) {
      return 'null';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (value instanceof Date) {
      return "'" + value.toISOString() + "'";
    }

    return "'" + value.replace("'", "\\'") + "'";
  }

  compilePrimaryKeys(primaryKeys: string[]): string {
    if (!primaryKeys.length) {
      return '';
    }

    return 'primary key (' + primaryKeys.join(', ') + ')';
  }
}
