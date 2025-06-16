import { Expression } from './Expression';

export type selectType = string;
export type whereBasic = { joinCondition: JoinCondition; negateCondition: boolean };
export type whereOp = { type: 'operation'; column: string; operation: string; value: Parameter };
export type whereOpColumn = {
  type: 'operationColumn';
  column1: string;
  operation: string;
  column2: string;
};
export type whereRaw = { type: 'raw'; sql: string; bindings: Parameter[] };
export type whereNull = { type: 'null'; column: string };
export type whereType = whereBasic & (whereOp | whereOpColumn | whereNull);

export type Parameter = string | number | Date | boolean | null | Expression | undefined;
export type JoinCondition = 'and' | 'or';
export type CompiledSql = { sql: string; bindings: Parameter[] };

export type havingType = whereBasic & (whereOp | whereRaw);

export type joinType = {
  type: 'inner' | 'left' | 'right' | 'full';
  table: string;
  conditions: whereType[];
};