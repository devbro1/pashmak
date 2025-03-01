import { Blueprint, Column } from "./Blueprint";

export class SchemaGrammar {
    toSql(blueprint: Blueprint): string {
        let sql = 'create table ' + blueprint.tableName + ' (';
        const columns = blueprint.columns.map((v:Column) => {
            return this.compileColumn(v);
        }).join(', ');

        const primaryKeys = this.compilePrimaryKeys(blueprint.primaryKeys);
        sql += [columns,primaryKeys].join(',') + ')';
        return sql;
    }

    compileColumn(column: Column): string {
        const rc = [`${column.columnName}`];

        if(column.properties.type === 'string') {
            rc.push('varchar(' + column.properties.length + ')');
        }
        else if(column.properties.type === 'char') {
            rc.push('char');
        }
        else if(column.properties.type === 'boolean') {
            rc.push('boolean');
        }
        else if(column.properties.type === 'integer') {
            rc.push('integer');
        }
        else if(column.properties.type === 'text') {
            rc.push('text');
        }
        else if(column.properties.type === 'timestamp') {
            rc.push('timestamp');
        }
        else if(column.properties.type === 'serial') {
            rc.push('serial');
        }
        else if(column.properties.type === 'float') {
            rc.push('decimal');
        }

        if(column.properties.nullable) {
            rc.push('null');
        }
        else {
            rc.push('not null');
        }

        if(column.properties.unique) {
            rc.push('unique');
        }

        console.log(column.properties.default);
        if(column.properties.default !== null) {
            rc.push('default ' + this.escape(column.properties.default));
        }

        return rc.join(' ');
    }

    escape(value: string | number | null): string {
        if(value === null) {
            return 'null';
        }

        if(typeof value === 'number') {
            return value.toString();
        }

        return "'" + value.replace("'","\\'") + "'";
    }

    compilePrimaryKeys(primaryKeys: string[]): string {
        if(!primaryKeys.length) {
            return '';
        }

        return 'primary key (' + primaryKeys.join(', ') + ')';
    }
}