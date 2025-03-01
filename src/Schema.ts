import { Blueprint } from "./Blueprint";
import { Connection } from "./Connection";
import { SchemaGrammar } from "./SchemaGrammar";

export class Schema {
    constructor(private readonly connection: Connection | null, private readonly grammar: SchemaGrammar) {  
    }

    createTable(tableName: string, structMethod: (blueprint: Blueprint) => void) {
        const blueprint = new Blueprint();
        blueprint.setTableName(tableName,false);
        structMethod(blueprint);
        
        let grammar = new SchemaGrammar();
        let sql = grammar.toSql(blueprint);
        this.connection?.runQuery({sql, bindings: []});
    }
}