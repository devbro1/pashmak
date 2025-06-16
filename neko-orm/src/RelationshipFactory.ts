import { Query } from 'neko-sql/src/Query';
import { BaseModel } from './baseModel';
import { Case } from 'change-case-all';

export type assocationOptions = {
  sync: boolean; // if true, will save the target model right away
};

export class RelationshipManager<Source extends BaseModel, Target extends BaseModel> {}

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

export class RelationshipManagerMto1<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
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

  async getQuery(): Promise<Query> {
    let q: Query = await this.targetModel.getQuery();
    Object.entries(this.target_keys).map(([local_key, target_key]) => {
      q.whereOp(target_key, '=', this.sourceObject[local_key]);
    });
    return q;
  }

  async get(): Promise<Target> {
    let q = await this.getQuery();
    let row = await q.get();
    return this.targetModel.newInstance<Target>(row[0], true);
  }
}

export class RelationshipManagerMtoM<
  Source extends BaseModel,
  Target extends BaseModel,
> extends RelationshipManager<Source, Target> {
  private sourceObject: BaseModel;
  private targetModel: typeof BaseModel;
  private type: RelationFactoryOptionsType['type'];
  private junctionTable: string;
  private sournceToJunctionKeyAssociation: Record<string, string>;
  private junctionToTargetAssociation: Record<string, string>;

  constructor(options: RelationFactoryOptionsType) {
    super();
    this.sourceObject = options.source;
    this.targetModel = options.targetModel;
    this.type = options.type;
    this.junctionTable = options.junctionTable;
    this.sournceToJunctionKeyAssociation = options.sournceToJunctionKeyAssociation;
    this.junctionToTargetAssociation = options.junctionToTargetAssociation;
  }

  async associate(obj: Target | Target[], options: assocationOptions = { sync: true }) {
    if (!Array.isArray(obj)) {
      obj = [obj];
    }

    let query: Query = await this.targetModel.getQuery();
    query = query.getConnection()?.getQuery()!;
    query.table(this.junctionTable);

    for (let i = 0; i < obj.length; i++) {
      await query.insert({
        image_id: this.sourceObject.id,
        tag_id: obj[i].id,
      });
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

      await query.whereOp(
        'tag_id',
        '=',
        obj[i].id
      ).whereOp(
        'image_id',
        '=',
        this.sourceObject.id
      ).delete();
    }
  }
  async getQuery(): Promise<Query> {
    let target = new this.targetModel();
    let q: Query = await this.sourceObject.getQuery();
    q.select([`${target.getTablename()}.*`]);

    q.innerJoin(
      this.junctionTable, [{
        type: 'operationColumn',
        column1: `${this.sourceObject.getTablename()}.id`,
        operation: '=',
        column2: `${this.junctionTable}.image_id`,
        joinCondition: 'and',
        negateCondition: false
      }]
    );

    q.innerJoin(
      target.getTablename(), [{
        type: 'operationColumn',
        column1: `${this.junctionTable}.${Case.snake(this.targetModel.name)}_id`,
        operation: '=',
        column2: `${target.getTablename()}.id`,
        joinCondition: 'and',
        negateCondition: false
      }]
    );
    // Object.entries(this.sournceToJunctionKeyAssociation).map(([source_key, junction_key]) => {
    //   q.whereOp(junction_key, '=', this.sourceObject[source_key]);
    // });
    return q;
  }

  async toArray(): Promise<Target[]> {
    let q = await this.getQuery();
    console.log(q.toSql());
    let rows = await q.get();

    return rows.map((row: any) => {
      let model = this.targetModel.newInstance(row, true);
      return model;
    });
  }

}
export type RelationFactoryOptionsType = {
  type:
    | 'hasMany'
    | 'belongsTo'
    | 'hasOne'
    | 'belongsToMany'
    | 'oneToMany'
    | 'manyToMany'
    | 'manyToOne';
  source: BaseModel;
  targetModel: typeof BaseModel;
  sourceToTargetKeyAssociation: Record<string, string>;
  junctionTable: string;
  sournceToJunctionKeyAssociation: Record<string, string>;
  junctionToTargetAssociation: Record<string, string>;
};

export class RelationshipFactory {
  // static create<Source extends BaseModel, Target extends BaseModel>(options: Partial<RelationFactoryOptionsType>): RelationshipManager<Source, Target> {
  //   let options2: RelationFactoryOptionsType = {
  //     type: 'hasMany',
  //     source: BaseModel.newInstance(),
  //     targetModel: BaseModel
  //   };

  //   options2.type = options.type!;
  //   if (!options.source || !options.targetModel) {
  //     throw new Error('Source and target model must be provided');
  //   }
  //   options2.source = options.source!;
  //   options2.targetModel = options.targetModel!;

  //   options2.junctionTable = options.junctionTable || '';
  //   options2.sourceToTargetKeyAssociation = options.sourceToTargetKeyAssociation!;
  //   options2.sournceToJunctionKeyAssociation = options.sournceToJunctionKeyAssociation || {};
  //   options2.junctionToSourceKeyAssociation = options.junctionToSourceKeyAssociation || {};

  //   if (['hasOne', 'hasMany'].includes(options2.type) && options2.sourceToTargetKeyAssociation === undefined) {
  //     options2.sourceToTargetKeyAssociation = {};
  //     let model_name = Case.snake(options2.source.constructor.name);
  //     // @ts-ignore
  //     for (const key of options2.source.primaryKey) {
  //       options2.sourceToTargetKeyAssociation[key] = `${model_name}_${key}`;
  //     }
  //   }

  //   switch (options2.type) {
  //     case 'oneToMany':
  //     case 'hasMany':
  //       return this.createHasMany(options2);
  //       break;
  //     case 'belongsTo':
  //     case 'manyToOne':
  //       return this.createBelongsTo(options2);
  //       break;
  //     default:
  //       throw new Error(`Unsupported relationship type: ${options.type}`);
  //   }
  // }

  static populateOptions(options: Partial<RelationFactoryOptionsType>): RelationFactoryOptionsType {
    let options2: RelationFactoryOptionsType = {
      source: BaseModel.newInstance(),
      targetModel: BaseModel,
      type: 'hasMany',
      sourceToTargetKeyAssociation: {},
      junctionTable: '',
      sournceToJunctionKeyAssociation: {},
      junctionToTargetAssociation: {},
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
    options2.junctionToTargetAssociation = options.junctionToTargetAssociation || {};

    if (
      ['hasOne', 'hasMany'].includes(options2.type) &&
      options2.sourceToTargetKeyAssociation === undefined
    ) {
      options2.sourceToTargetKeyAssociation = {};
      let model_name = Case.snake(options2.source.constructor.name);
      // @ts-ignore
      for (const key of options2.source.primaryKey) {
        options2.sourceToTargetKeyAssociation[key] = `${model_name}_${key}`;
      }
    }
    else if (options2.type === 'belongsTo' && Object.keys(options2.sourceToTargetKeyAssociation).length === 0) {
      options2.sourceToTargetKeyAssociation = {};
      let model_name = Case.snake(options2.targetModel.name);
      // @ts-ignore
      for (const key of options2.targetModel.primaryKey) {
        options2.sourceToTargetKeyAssociation[`${model_name}_${key}`] = `${key}`;
      }
    }
    else if (options2.type === 'belongsToMany') {
      if (options2.junctionTable === '') {
        options2.junctionTable = `${Case.snake(options2.source.constructor.name)}_${Case.snake(options2.targetModel.name)}`;
      }

      if (Object.keys(options2.sournceToJunctionKeyAssociation).length === 0) {
        options2.sournceToJunctionKeyAssociation = {};
        let model_name = Case.snake(options2.source.constructor.name);
        // @ts-ignore
        for (const key of options2.source.primaryKey) {
          options2.sournceToJunctionKeyAssociation[key] = `${model_name}_${key}`;
        }
      }
      if (Object.keys(options2.junctionToTargetAssociation).length === 0) {
        options2.junctionToTargetAssociation = {};
        let model_name = Case.snake(options2.targetModel.name);

        let target = new options2.targetModel();

        // @ts-ignore
        for (const key of target.primaryKey) {
          options2.junctionToTargetAssociation[`${model_name}_${key}`] = key;
        }
      }
    }

    return options2;
  }

  static createHasMany<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManager1toM<Source, Target> {
    options.type = 'hasMany';
    return new RelationshipManager1toM<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }

  static createBelongsTo<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManagerMto1<Source, Target> {
    options.type = 'belongsTo';
    return new RelationshipManagerMto1<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }

  static createBelongsToMany<
    Source extends BaseModel,
    Target extends BaseModel,
  >(options: Partial<RelationFactoryOptionsType>): RelationshipManagerMtoM<Source, Target> {
    options.type = 'belongsToMany';
    return new RelationshipManagerMtoM<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }
}
