import { Query } from 'neko-sql/src/Query';
import { BaseModel } from './baseModel';
import { Case } from "change-case-all";

export class RelationshipManager<Source extends BaseModel, Target extends BaseModel> {

}

export class RelationshipManager1toM<Source extends BaseModel, Target extends BaseModel> extends RelationshipManager<Source, Target> {
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

  async addAndSync(obj: Target | Target[]) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = this.sourceObject[local_key];
    });

    for (const o of obj) {
      o.fill(updates);
      await o.save();
    }
  }

  async removeAndSync(obj: Target | Target[]) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = undefined;
    });

    for (const o of obj) {
      o.fill(updates);
      await o.save();
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

export class RelationshipManagerMto1<Source extends BaseModel, Target extends BaseModel> extends RelationshipManager<Source, Target> {
  private sourceObject: BaseModel;
  private targetModel: typeof BaseModel;
  private target_keys: Record<string, string>;
  private type: RelationFactoryOptionsType['type'];

  constructor(options: RelationFactoryOptionsType) {
    super();
    this.type = options.type;
    this.sourceObject = options.source;
    this.targetModel = options.targetModel;
    this.target_keys = options.sourceToTargetKeyAssociation!;

  }

  async addAndSync(obj: Target | Target[]) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = this.sourceObject[local_key];
    });

    for (const o of obj) {
      o.fill(updates);
      await o.save();
    }
  }

  async removeAndSync(obj: Target | Target[]) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let updates: Record<string, any> = {};
    Object.entries(this.target_keys).forEach(([local_key, target_key]) => {
      updates[target_key] = undefined;
    });

    for (const o of obj) {
      o.fill(updates);
      await o.save();
    }
  }

  async getQuery(): Promise<Query> {
    let q: Query = await this.targetModel.getQuery();
    Object.entries(this.target_keys).map(([local_key, target_key]) => {
      q.whereOp(target_key, '=', this.sourceObject[local_key]);
    });
    return q;
  }

  async get() {
    let q = await this.getQuery();
    let row = await q.get();
    console.log('ASD', row);
    return this.targetModel.newInstance(row[0], true);
  }
}

export type RelationFactoryOptionsType = {
  type: 'hasMany' | 'belongsTo' | 'hasOne' | 'belongsToMany' |
  'oneToOne' | 'oneToMany' | 'manyToMany' | 'manyToOne';
  source: BaseModel;
  targetModel: typeof BaseModel;
  sourceToTargetKeyAssociation?: Record<string, string>;
  junctionTable?: string;
  sournceToJunctionKeyAssociation?: Record<string, string>;
  junctionToSourceKeyAssociation?: Record<string, string>;
};

export class RelationshipFactory {
  static create<Source extends BaseModel, Target extends BaseModel>(options: Partial<RelationFactoryOptionsType>): RelationshipManager<Source, Target> {
    let options2: RelationFactoryOptionsType = {
      type: 'hasMany',
      source: BaseModel.newInstance(),
      targetModel: BaseModel
    };

    options2.type = options.type!;
    if (!options.source || !options.targetModel) {
      throw new Error('Source and target model must be provided');
    }
    options2.source = options.source!;
    options2.targetModel = options.targetModel!;

    options2.junctionTable = options.junctionTable || '';
    options2.sourceToTargetKeyAssociation = options.sourceToTargetKeyAssociation!;
    options2.sournceToJunctionKeyAssociation = options.sournceToJunctionKeyAssociation || {};
    options2.junctionToSourceKeyAssociation = options.junctionToSourceKeyAssociation || {};

    if(options2.sourceToTargetKeyAssociation === undefined) {
      options2.sourceToTargetKeyAssociation = {};
      let model_name = Case.snake(options2.source.constructor.name);
      // @ts-ignore
      for(const key of options2.source.primaryKey) {
        options2.sourceToTargetKeyAssociation[key] = `${model_name}_${key}`;
      }
      
    }
    switch (options2.type) {
      case 'oneToMany':
      case 'hasMany':
        return this.createHasMany(options2);
        break;
      case 'belongsTo':
      case 'oneToOne':
      case 'manyToOne':
        return this.createBelongsTo(options2);
        break;
      default:
        throw new Error(`Unsupported relationship type: ${options.type}`);
    }
  }

  static createHasMany<Source extends BaseModel, Target extends BaseModel>(options: RelationFactoryOptionsType): RelationshipManager<Source, Target> {
    return new RelationshipManager1toM<Source, Target>(options);
  }

  static createBelongsTo<Source extends BaseModel, Target extends BaseModel>(options: RelationFactoryOptionsType): RelationshipManager<Source, Target> {
    return new RelationshipManagerMto1<Source, Target>(options);
  }
}
