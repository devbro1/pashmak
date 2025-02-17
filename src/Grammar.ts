import { table } from "console";
import { Query } from "./Query";
import { Parameter, selectType, whereOp, whereType } from "./types";

function toUpperFirst(str: string) {
    return str.substring(0,1).toUpperCase() + str.substring(1);
}
export class Grammar {
    sqlParts: string[] = ['select', 'table','where'];
    
    toSql(query: Query) {
        let sql = '';
        let bindings : Parameter[] = [];
        let sqlParts: string[] = [];

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

    compileSelect(selects: selectType[]) {
        let rc = selects.map(v => {
            return v;
        }).join(', ');

        return {sql: 'select ' + rc, bindings: []};
    }

    compileTable(tableName: string) {
        let rc = '';
        if(tableName.length) {
            rc = 'from ' + tableName;
        }

        return { sql: rc, bindings: [] };
    }

    compileWhere(wheres: whereType[]) {
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

    compileWhereOperation(w: whereOp) {
        return {
            sql: `${w.column} ${w.operation} ?`,
            bindings: [ w.value ],
        }
    }
}