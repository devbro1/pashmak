import { Expression } from './Expression.mjs';
import { Query } from './Query.mjs';

export type selectType = string;
export type whereBasic = { joinCondition: JoinCondition; negateCondition: boolean };
export type whereOp = { type: 'operation'; column: string; operation: string; value: Parameter };
export type whereOpColumn = {
  type: 'operationColumn';
  column1: string;
  operation: string;
  column2: string;
};

export type whereNested = { type: 'nested'; query: Query };
export type whereRaw = { type: 'raw'; sql: string; bindings: Parameter[] };
export type whereNull = { type: 'null'; column: string };
export type whereType = whereBasic & (whereOp | whereOpColumn | whereNested | whereNull | whereRaw);

export type Parameter =
  | string
  | number
  | Date
  | boolean
  | null
  | Expression
  | undefined
  | number[]
  | string[];
export type JoinCondition = 'and' | 'or';
export type CompiledSql = { sql: string; bindings: Parameter[] };

export type havingType = whereBasic & (whereOp | whereRaw);

export type joinType = {
  type: 'inner' | 'left' | 'right' | 'full' | 'cross';
  table: string;
  conditions: whereType[];
};
