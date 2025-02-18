import { Connection } from './Connection';
import { Grammar } from './Grammar';
import { JoinCondition, Parameter, selectType, whereType } from './types';

export class Query {
  allowedOperations: string[] = ['=','>','<','!=', 'like','ilike'];

  _select: selectType[] = ['*'];
  _table: string = '';
  _where: whereType[] = [];

  constructor(private readonly connection: Connection | null, private readonly grammar: Grammar) {  
  }

  table(tableName: string) {
    this._table = tableName;
  }
  
  whereOp(column: string, operation: typeof this.allowedOperations[number], value: Parameter, joinCondition: JoinCondition = 'and', negateCondition: boolean = false) {
    this._where.push({type: 'operation', column, operation, value, joinCondition, negateCondition});
    return this;
  }

  whereNull(column: string, joinCondition: JoinCondition = 'and', negateCondition: boolean = false) {
    this._where.push({type: 'null', column, joinCondition, negateCondition});
    return this;
  }

  select(selects: selectType[]) {
    this._select = [...selects];
  }

  toSql() {
    return this.grammar.toSql(this);
  }

  async get() {
    return this.connection?.runQuery(this.toSql());
  }
}
