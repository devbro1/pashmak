import { Connection } from './Connection';
import { QueryGrammar } from './QueryGrammar';
import { CompiledSql, JoinCondition, Parameter, selectType, whereType, havingType } from './types';

export type QueryParts = {
  select: selectType[];
  table: string;
  where: whereType[];
  groupBy: string[];
  having: havingType[];
  orderBy: string[];
  limit: number | null;
  offset: number | null;
};

export class Query {
  allowedOperations: string[] = ['=', '>', '<', '!=', 'like', 'ilike'];
  parts: QueryParts = {
    select: ['*'],
    table: '',
    where: [],
    groupBy: [],
    having: [],
    orderBy: [],
    limit: null,
    offset: null,
  };

  constructor(
    private readonly connection: Connection | null,
    private readonly grammar: QueryGrammar
  ) {}

  table(tableName: string): this {
    this.parts.table = tableName;
    return this;
  }

  whereOp(
    column: string,
    operation: (typeof this.allowedOperations)[number],
    value: Parameter,
    joinCondition: JoinCondition = 'and',
    negateCondition: boolean = false
  ): this {
    this.parts.where.push({
      type: 'operation',
      column,
      operation,
      value,
      joinCondition,
      negateCondition,
    });
    return this;
  }

  whereNull(
    column: string,
    joinCondition: JoinCondition = 'and',
    negateCondition: boolean = false
  ): this {
    this.parts.where.push({ type: 'null', column, joinCondition, negateCondition });
    return this;
  }

  clearWhere(): this {
    this.parts.where = [];
    return this;
  }

  select(selects: selectType[]): this {
    this.parts.select = [...selects];
    return this;
  }

  groupBy(columns: string[]): this {
    this.parts.groupBy = [...columns];
    return this;
  }

  havingOp(
    column: string,
    operation: (typeof this.allowedOperations)[number],
    value: Parameter,
    joinCondition: JoinCondition = 'and',
    negateCondition: boolean = false
  ): this {
    this.parts.having.push({
      type: 'operation',
      column,
      operation,
      value,
      joinCondition,
      negateCondition,
    });
    return this;
  }

  havingRaw(
    sql: string,
    bindings: Parameter[],
    joinCondition: JoinCondition = 'and',
    negateCondition: boolean = false
  ): this {
    this.parts.having.push({ type: 'raw', sql, bindings, joinCondition, negateCondition });
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

  async getCursor() {
    return await this.connection?.runCursor(this.toSql());
  }

  getConnection(): Connection | null {
    return this.connection;
  }

  async insert(data: Record<string, Parameter>) {
    const csql: CompiledSql = this.grammar.compileInsert(this, data);
    return await this.connection?.runQuery(csql);
  }

  async insertGetId(
    data: Record<string, Parameter>,
    options: { primaryKey: string[] } = { primaryKey: ['id'] }
  ) {
    const csql: CompiledSql = this.grammar.compileInsertGetId(this, data, options);
    return await this.connection?.runQuery(csql);
  }

  async update(data: Record<string, Parameter>) {
    const csql: CompiledSql = this.grammar.compileUpdate(this, data);
    return await this.connection?.runQuery(csql);
  }

  async upsert(data: Record<string, Parameter>, uniqueColumns: string[], updateColumns: string[]) {
    const csql: CompiledSql = this.grammar.compileUpsert(this, data, uniqueColumns, updateColumns);
    return await this.connection?.runQuery(csql);
  }

  async delete() {
    const csql: CompiledSql = this.grammar.compileDelete(this);
    return await this.connection?.runQuery(csql);
  }
}
