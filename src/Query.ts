import { Connection } from './Connection';
import { QueryGrammar } from './QueryGrammar';
import { CompiledSql, JoinCondition, Parameter, selectType, whereType } from './types';

export type QueryParts = {
  orderBy: string[],
  limit: number | null,
  offset: number | null,
}

export class Query {
  allowedOperations: string[] = ['=','>','<','!=', 'like','ilike'];
  _select: selectType[] = ['*'];
  _table: string = '';
  _where: whereType[] = [];
  parts: QueryParts = {
    orderBy: [],
    limit: null,
    offset: null,
  }

  constructor(private readonly connection: Connection | null, private readonly grammar: QueryGrammar) {  
  }

  table(tableName: string): this {
    this._table = tableName;
    return this;
  }
  
  whereOp(column: string, operation: typeof this.allowedOperations[number], value: Parameter, joinCondition: JoinCondition = 'and', negateCondition: boolean = false): this {
    this._where.push({type: 'operation', column, operation, value, joinCondition, negateCondition});
    return this;
  }

  whereNull(column: string, joinCondition: JoinCondition = 'and', negateCondition: boolean = false): this {
    this._where.push({type: 'null', column, joinCondition, negateCondition});
    return this;
  }

  select(selects: selectType[]): this {
    this._select = [...selects];
    return this;
  }

  orderBy(column: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.parts.orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(limit: number): this {
    this.parts.limit = limit;
    return this;
  }

  offset(offset: number): this {
    this.parts.offset = offset;
    return this;
  }

  toSql(): CompiledSql {
    return this.grammar.toSql(this);
  }

  async get() {
    return await this.connection?.runQuery(this.toSql());
  }

  async insert(data: Record<string, Parameter>) {
    const csql: CompiledSql = this.grammar.compileInsert(this,data);
    return await this.connection?.runQuery(csql);
  }

  async update(data: Record<string, Parameter>) {
    const csql: CompiledSql = this.grammar.compileUpdate(this,data);
    return await this.connection?.runQuery(csql);
  }
}
