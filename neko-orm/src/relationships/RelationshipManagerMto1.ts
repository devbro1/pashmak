import { Query } from '@devbro/neko-sql';
import { BaseModel } from '../baseModel';
import { Case } from 'change-case-all';
import { assocationOptions, RelationFactoryOptionsType } from './types';
import { RelationshipManager } from './RelationshipManager';

export class RelationshipManagerMto1<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  constructor(options: RelationFactoryOptionsType) {
    super(options);
  }

  async associate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (Array.isArray(obj) && obj.length !== 1) {
      throw new Error('Cannot associate multiple objects to a belongsTo relationship');
    }
    obj = Array.isArray(obj) ? obj : [obj];

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([source_key, target_key]) => {
      updates[source_key] = obj[0][target_key];
    });

    this.sourceObject.fill(updates);
    if (this.preAssociate) {
      await this.preAssociate(this.sourceObject);
    }
    options.sync && (await this.sourceObject.save());
  }

  async dessociate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (Array.isArray(obj) && obj.length !== 1) {
      throw new Error('Cannot associate multiple objects to a belongsTo relationship');
    }
    obj = Array.isArray(obj) ? obj : [obj];

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([source_key, target_key]) => {
      if (this.sourceObject[source_key] !== obj[0][target_key]) {
        throw new Error(
          `Cannot dissociate ${obj[0].constructor.name} with ${this.sourceObject.constructor.name}, values for ${source_key}:${target_key} keys do not match`
        );
      }
      updates[source_key] = undefined;
    });

    this.sourceObject.fill(updates);
    options.sync && (await this.sourceObject.save());
  }

  async unlink(options: assocationOptions = { sync: true }) {
    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([source_key, target_key]) => {
      updates[source_key] = undefined;
    });

    this.sourceObject.fill(updates);
    options.sync && (await this.sourceObject.save());
  }

  async getBaseQuery(): Promise<Query> {
    let q: Query = await this.targetModel.getQuery();
    Object.entries(this.target_keys).map(([local_key, target_key]) => {
      q.whereOp(target_key, '=', this.sourceObject[local_key]);
    });
    return q;
  }

  async get(): Promise<Target | undefined> {
    let q = await this.getQuery();
    let row = await q.get();

    if (row.length === 0) {
      return undefined;
    }
    return this.targetModel.newInstance<Target>(row[0], true);
  }
}
