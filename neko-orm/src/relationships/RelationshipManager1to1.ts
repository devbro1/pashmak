import { Query } from 'neko-sql/src/Query';
import { BaseModel } from '../baseModel';
import { Case } from 'change-case-all';
import { assocationOptions, RelationFactoryOptionsType } from './types';
import { RelationshipManager } from './RelationshipManager';

export class RelationshipManager1to1<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  constructor(options: RelationFactoryOptionsType) {
    super(options);
  }

  async get(): Promise<Target | undefined> {
    let q = await this.getQuery();
    let rows = await q.get();

    if (rows.length == 0) {
      return undefined;
    }

    return this.targetModel.newInstance<Target>(rows[0], true);
  }

  async associate(obj: Target, options: assocationOptions = { sync: true }) {
    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = this.sourceObject[local_key];
    });

    obj.fill(updates);
    options.sync && (await obj.save());
  }

  async dessociate(obj: Target, options: assocationOptions = { sync: true }) {
    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = undefined;
    });

    obj.fill(updates);
    options.sync && (await obj.save());
  }

  async getBaseQuery(): Promise<Query> {
    let q: Query = await this.targetModel.getQuery();
    Object.entries(this.target_keys).map(([local_key, target_key]) => {
      q.whereOp(target_key, '=', this.sourceObject[local_key]);
    });
    q.limit(1);

    return q;
  }
}
