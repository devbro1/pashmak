import { table } from "console";
import { Query } from "./Query";
import { Parameter, CompiledSql, selectType, whereNull, whereOp, whereType } from "./types";

function toUpperFirst(str: string) {
    return str.substring(0,1).toUpperCase() + str.substring(1);
}
export abstract class QueryGrammar {
    sqlParts: string[] = ['select', 'table','where'];
    
    toSql(query: Query): CompiledSql {
        let sql = '';
        let bindings : Parameter[] = [];

        for(const part of this.sqlParts) {
            // @ts-ignore
            const funcName: keyof this = 'compile' + toUpperFirst(part);
            // @ts-ignore
            let r = this[funcName](query['_' + part]);
            if(!sql) {
                sql = r.sql;
            }
            else if(r.sql) {
                sql += ' ' + r.sql;
            }
            bindings = [...bindings,...r.bindings];
        }
        return { sql, bindings };
    }

    compileSelect(selects: selectType[]): CompiledSql {
        let rc = selects.map(v => {
            return v;
        }).join(', ');

        return {sql: 'select ' + rc, bindings: []};
    }

    compileTable(tableName: string): CompiledSql {
        let rc = '';
        if(tableName.length) {
            rc = 'from ' + tableName;
        }

        return { sql: rc, bindings: [] };
    }

    compileWhere(wheres: whereType[]): CompiledSql {
        let sql = '';
        let bindings: Parameter[] = [];

        for(const w of wheres) {
            sql += ' ' + w.joinCondition + ' ';
            if(w.negateCondition) {
                sql += 'not ';
            }
            let funcName = 'compileWhere' + toUpperFirst(w.type);
            // @ts-ignore
            let wh = this[funcName](w);
            sql += wh.sql;
            bindings = [...bindings, ...wh.bindings];
        }
        if(sql.startsWith(' and ')) {
            sql = 'where ' + sql.substring(' and '.length);
        }
        else if(sql.startsWith(' or ')) {
            sql = 'where ' + sql.substring(' or '.length);
        }
        return { sql, bindings};
    }

    compileWhereOperation(w: whereOp): CompiledSql {
        return {
            sql: `${w.column} ${w.operation} ${this.getVariablePlaceholder()}`,
            bindings: [ w.value ],
        }
    }

    abstract getVariablePlaceholder(): string;

    compileWhereNull(w: whereNull): CompiledSql {
        return {
            sql: `${w.column} is null`,
            bindings: [],
        }
    }

    compileInsert(query: Query, data: Record<string, Parameter>): CompiledSql {
        let sql = 'insert into ' + query._table + ' (';
        const columns : string[] = [];
        const bindings: Parameter[] = [];
        const values: string[] = [];

        for(const [k,v] of Object.entries(data)) {
            columns.push(k);
            bindings.push(v);
            values.push(this.getVariablePlaceholder());
        }

        sql += columns.join(', ') + ') values (' + values + ')';

        return { sql, bindings };
    }
}