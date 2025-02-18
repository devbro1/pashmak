export type selectType = string;
export type whereBasic = { joinCondition: JoinCondition, negateCondition: boolean};
export type whereOp = { type: 'operation', column: string, operation: string, value: Parameter};
export type whereNull = { type: 'null', column: string};
export type whereType = whereBasic & (whereOp | whereNull);

export type Parameter = string | number | null;
export type JoinCondition = 'and' | 'or';
export type CompiledSql = { sql: string, bindings: Parameter[] };