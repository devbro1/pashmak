import { Query } from 'neko-sql/src/Query';
import { BaseModel } from './baseModel';

export class Relationship<Source extends BaseModel, Target extends BaseModel> {
  private sourceObject: Source;
  private relationship_type = 'one-to-many';
  private junction_table_name = '';
  private target_id = 'post_id';

  constructor(
    source: any,
    private TargetModel: typeof BaseModel
  ) {
    this.sourceObject = source;
  }

  async toArray(): Promise<Target[]> {
    let q = await this.getQuery();
    let rows = await q.get();
    return rows.map((row: any) => {
      let model = new this.TargetModel(row);
      model.setExists(true);
      return model;
    });
  }

  add(obj: Target) {}

  remove(obj: Target) {}

  async sync() {}

  async addAndSync(obj: Target) {}

  async removeAndSync(obj: Target) {}

  async refresh() {}

  async getQuery(): Promise<Query> {
    let q: Query = await this.TargetModel.getQuery();
    q.whereOp(this.target_id, '=', this.sourceObject.id!);
    return q;
  }

  async *[Symbol.asyncIterator]() {
    let q = await this.getQuery();

    let cur = await q.getCursor();
    let has = true;
    while (has) {
      let row = await cur.read(1);
      if (row.length) {
        let model = new this.TargetModel(row[0]);
        model.setExists(true);
        yield model;
      } else {
        has = false;
      }
    }
  }
}

export type RelationFactoryOptionsType = {
  source: BaseModel;
  targetModel: typeof BaseModel;
};

export class RelationshipFactory {
  static createHasMany<Source extends BaseModel, Target extends BaseModel>({
    source,
    targetModel,
  }: RelationFactoryOptionsType): Relationship<Source, Target> {
    return new Relationship<Source, Target>(source, targetModel);
  }
}
