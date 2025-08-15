import { Query } from '@devbro/neko-sql';
import { BaseModel } from '../baseModel.mjs';
import { Case } from 'change-case-all';
import { assocationOptions, RelationFactoryOptionsType } from './types.mjs';
import { RelationshipManager } from './RelationshipManager.mjs';

export class RelationshipManagerPolymorphic1toM<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  constructor(options: RelationFactoryOptionsType) {
    super(options);
  }

  async toArray(): Promise<Target[]> {
    let q = await this.getQuery();
    let rows = await q.get();

    return rows.map((row: any) => {
      let model = this.targetModel.newInstance(row, true);
      return model;
    });
  }

  async associate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = this.sourceObject[local_key];
    });

    for (let i = 0; i < obj.length; i++) {
      obj[i].fill(updates);
      options.sync && (await obj[i].save());
    }
  }

  async dissociate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = undefined;
    });

    for (let i = 0; i < obj.length; i++) {
      obj[i].fill(updates);
      options.sync && (await obj[i].save());
    }
  }

  async getBaseQuery(): Promise<Query> {
    let q: Query = await this.targetModel.getQuery();
    Object.entries(this.target_keys).map(([local_key, target_key]) => {
      q.whereOp(target_key, '=', this.sourceObject[local_key]);
    });

    return q;
  }

  async *[Symbol.asyncIterator]() {
    let q = await this.getQuery();

    let cur = await q.getCursor();
    let has = true;
    while (has) {
      let row = await cur.read(1);
      if (row.length) {
        yield this.targetModel.newInstance(row[0], true);
      } else {
        has = false;
      }
    }
  }
}
