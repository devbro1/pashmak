import { Blueprint, Column, ForeignKeyConstraint } from './Blueprint';
import { Expression } from './Expression';
import { CompiledSql, Parameter } from './types';

export class SchemaGrammar {
  toSql(blueprint: Blueprint): string {
    if (!blueprint.existingTable) {
      return this.compileCreateTable(blueprint).sql;
    } else if (blueprint.existingTable) {
      return this.compileAlterTable(blueprint).sql;
    }

    throw new Error('bad blueprint to compile: ' + blueprint.tableName);
  }

  compileCreateTable(blueprint: Blueprint): CompiledSql {
    let sql = 'create table ' + blueprint.tableName + ' (';
    const columns = blueprint.columns
      .map((v: Column) => {
        return this.compileColumn(v);
      })
      .join(', ');

    const primaryKeys = this.compilePrimaryKeys(blueprint.primaryKeys);
    let foreignKeys: string[] = [];
    if (blueprint.foreignKeys.length > 0) {
      foreignKeys = blueprint.foreignKeys.map((v: ForeignKeyConstraint) => {
        return this.compileForeignKey(v);
      });
    }
    sql += [columns, primaryKeys, ...foreignKeys].join(',') + ')';
    return { sql, bindings: [] };
  }

  compileAlterTable(blueprint: Blueprint): CompiledSql {
    let sql: string[] = ['alter table ' + blueprint.tableName];
    const add_columns = blueprint.columns.map((v: Column) => {
      return 'add column ' + this.compileColumn(v);
    });

    const drop_columns = blueprint.drop_coumns.map((v: string) => {
      return 'drop column ' + v;
    });

    sql = sql.concat([[...add_columns, ...drop_columns].join(', ')]);

    return { sql: sql.join(' '), bindings: [] };
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
    if (value === null || value === undefined) {
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

    if (value instanceof Expression) {
      return value.toCompiledSql().sql;
    }

    return "'" + value.replace("'", "\\'") + "'";
  }

  compilePrimaryKeys(primaryKeys: string[]): string {
    if (!primaryKeys.length) {
      return '';
    }

    return 'primary key (' + primaryKeys.join(', ') + ')';
  }

  compileTables(schema: string | string[] | undefined = undefined): CompiledSql {
    return {
      sql:
        'select c.relname as name, n.nspname as schema, pg_total_relation_size(c.oid) as size, ' +
        "obj_description(c.oid, 'pg_class') as comment from pg_class c, pg_namespace n " +
        "where c.relkind in ('r', 'p') and n.oid = c.relnamespace and " +
        this.compileSchemaWhereClause(schema, 'n.nspname') +
        ' order by n.nspname, c.relname',
      bindings: [],
    };
  }

  compileTableExists(tableName: string, schema: string = ''): CompiledSql {
    return {
      sql:
        'select exists (select 1 from pg_class c, pg_namespace n where ' +
        'n.nspname = ' +
        (schema ? this.escape(schema) : 'current_schema()') +
        " and c.relname = $1 and c.relkind in ('r', 'p') and n.oid = c.relnamespace)",
      bindings: [tableName],
    };
  }

  compileDropTable(tableName: string): CompiledSql {
    return { sql: `drop table ${this.doubleQuoteString(tableName)}`, bindings: [] };
  }

  protected compileSchemaWhereClause(
    schema: string | string[] | undefined,
    column: string
  ): string {
    if (Array.isArray(schema) && schema.length > 0) {
      return `${column} in (${this.quoteString(schema)})`;
    } else if (schema && typeof schema === 'string') {
      return `${column} = ${this.quoteString(schema)}`;
    } else {
      return `${column} <> 'information_schema' and ${column} not like 'pg\\_%'`;
    }
  }

  protected quoteString(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.map((v) => `'${v.replace(/'/g, "\\'")}'`).join(', ');
    }
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  protected doubleQuoteString(value: string | string[]): string {
    if (Array.isArray(value)) {
      return value.map((v) => this.doubleQuoteString(v)).join(', ');
    }
    return `"${value.replace(/"/g, '\\"')}"`;
  }

  protected compileForeignKey(foreignKey: ForeignKeyConstraint): string {
    //FOREIGN KEY (PersonID) REFERENCES users(id)
    const rc = [`FOREIGN KEY (${foreignKey.column})`];
    rc.push(`references ${foreignKey.reference_table.table}(${foreignKey.reference_table.column})`);

    if (foreignKey.onDeleteAction) {
      rc.push(`on delete ${foreignKey.onDeleteAction}`);
    }

    if (foreignKey.onUpdateAction) {
      rc.push(`on update ${foreignKey.onUpdateAction}`);
    }

    return rc.join(' ');
  }
}
