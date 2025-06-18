import { Query } from 'neko-sql/src/Query';
import { BaseModel } from '../baseModel';
import { Case } from 'change-case-all';
import { assocationOptions, RelationFactoryOptionsType } from './types';
import { RelationshipManager } from './RelationshipManager';

export class RelationshipManager1toM<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  private sourceObject: BaseModel;
  private targetModel: typeof BaseModel;
  private target_keys: Record<string, string> = {}; // { id: 'post_id' }
  private type: RelationFactoryOptionsType['type'];

  constructor(options: RelationFactoryOptionsType) {
    super();
    this.type = options.type;
    this.sourceObject = options.source;
    this.targetModel = options.targetModel;
    this.target_keys = options.sourceToTargetKeyAssociation!;
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

  async dessociate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
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

  async getQuery(): Promise<Query> {
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
