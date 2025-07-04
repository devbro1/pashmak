import { Query } from 'neko-sql';
import { BaseModel } from '../baseModel';
import { Case } from 'change-case-all';
import { assocationOptions, RelationFactoryOptionsType } from './types';
import { RelationshipManager } from './RelationshipManager';
import { Parameter } from 'neko-sql';

export class RelationshipManagerMtoM<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  constructor(options: RelationFactoryOptionsType) {
    super(options);
  }

  async associate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let query: Query = await this.targetModel.getQuery();
    query = query.getConnection()?.getQuery()!;
    query.table(this.junctionTable);

    for (let i = 0; i < obj.length; i++) {
      let insert_obj: Record<string, Parameter> = {};

      for (const p of Object.entries(this.sourceToJunctionKeyAssociation)) {
        insert_obj[p[1]] = this.sourceObject[p[0]];
      }

      for (const p of Object.entries(this.junctionToTargetAssociation)) {
        insert_obj[p[0]] = obj[i][p[1]];
      }

      insert_obj = this.preMtoMAssociate
        ? await this.preMtoMAssociate(insert_obj, obj[i])
        : insert_obj;
      await query.insert(insert_obj);
    }
  }

  async dessociate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let query: Query = await this.targetModel.getQuery();
    query = query.getConnection()?.getQuery()!;
    query.table(this.junctionTable);

    for (let i = 0; i < obj.length; i++) {
      query = query.getConnection()?.getQuery()!;
      query.table(this.junctionTable);

      Object.entries(this.sourceToJunctionKeyAssociation).map(([source_key, junction_key]) => {
        query.whereOp(junction_key, '=', this.sourceObject[source_key]);
      });

      Object.entries(this.junctionToTargetAssociation).map(([junction_key, target_key]) => {
        query.whereOp(junction_key, '=', obj[i][target_key]);
      });

      query = this.preDeleteQueryModifier ? await this.preDeleteQueryModifier(query) : query;

      await query.delete();
    }
  }
  async getBaseQuery(): Promise<Query> {
    let target = new this.targetModel();
    let q: Query = await this.sourceObject.getQuery();
    q.select([`${target.getTablename()}.*`]);

    q.innerJoin(
      this.junctionTable,
      Object.entries(this.sourceToJunctionKeyAssociation).map(([source_key, junction_key]) => {
        return {
          type: 'operationColumn',
          column1: `${this.sourceObject.getTablename()}.${source_key}`,
          operation: '=',
          column2: `${this.junctionTable}.${junction_key}`,
          joinCondition: 'and',
          negateCondition: false,
        };
      })
    );

    q.innerJoin(
      target.getTablename(),
      Object.entries(this.junctionToTargetAssociation).map(([junction_key, target_key]) => {
        return {
          type: 'operationColumn',
          column1: `${this.junctionTable}.${junction_key}`,
          operation: '=',
          column2: `${this.targetModel.newInstance().getTablename()}.${target_key}`,
          joinCondition: 'and',
          negateCondition: false,
        };
      })
    );
    Object.entries(this.sourceToJunctionKeyAssociation).map(([source_key, junction_key]) => {
      q.whereOp(junction_key, '=', this.sourceObject[source_key]);
    });
    return q;
  }

  async toArray(): Promise<Target[]> {
    let q = await this.getQuery();
    let rows = await q.get();

    return rows.map((row: any) => {
      let model = this.targetModel.newInstance(row, true);
      return model;
    });
  }
}
