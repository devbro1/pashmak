import { Connection } from './Connection';
import { QueryGrammar } from './QueryGrammar';
import { CompiledSql, JoinCondition, Parameter, selectType, whereType } from './types';

export class Query {
  allowedOperations: string[] = ['=','>','<','!=', 'like','ilike'];
  _select: selectType[] = ['*'];
  _table: string = '';
  _where: whereType[] = [];

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

  toSql(): CompiledSql {
    return this.grammar.toSql(this);
  }

  async get() {
    return await this.connection?.runQuery(this.toSql());
  }

  async insert(data: Record<string, Parameter>) {
    const csql: CompiledSql = this.grammar.compileInsert(this,data);

    return this.connection?.runQuery(csql);
  }
}
