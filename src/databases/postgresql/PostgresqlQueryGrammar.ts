import { Query } from "../../Query";
import { QueryGrammar } from "../../QueryGrammar";
import { CompiledSql } from "../../types";

export class PostgresqlQueryGrammar extends QueryGrammar{
    private parameterIndex : number;
    constructor() {
        super();
        this.parameterIndex = 1;
    }

    toSql(query: Query): CompiledSql {
        this.parameterIndex = 1;
        return super.toSql(query);
    }

    getVariablePlaceholder(): string
    {
        return '$' + (this.parameterIndex++);
    }
}