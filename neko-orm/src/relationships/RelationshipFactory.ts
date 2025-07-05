import { Query } from '@devbro/neko-sql';
import { BaseModel } from '../baseModel';
import { Case, snakeCase } from 'change-case-all';
import { RelationshipManager1to1 } from './RelationshipManager1to1';
import { RelationshipManager1toM } from './RelationshipManager1toM';
import { RelationshipManagerMto1 } from './RelationshipManagerMto1';
import { RelationshipManagerMtoM } from './RelationshipManagerMtoM';
import { RelationFactoryOptionsType } from './types';
import { RelationshipManager } from './RelationshipManager';

export class RelationshipFactory {
  static populateOptions(options: Partial<RelationFactoryOptionsType>): RelationFactoryOptionsType {
    let options2: RelationFactoryOptionsType = {
      source: BaseModel.newInstance(),
      targetModel: BaseModel,
      type: 'hasMany',
      sourceToTargetKeyAssociation: {},
      junctionTable: '',
      sourceToJunctionKeyAssociation: {},
      junctionToTargetAssociation: {},
      queryModifier: async (query: Query) => query,
      morphIdentifier: '',
      preAssociate: async (obj: BaseModel) => obj,
    };

    options2.type = options.type!;
    if (!options.source || !options.targetModel) {
      throw new Error('Source and target model must be provided');
    }
    options2.source = options.source!;
    options2.targetModel = options.targetModel!;

    options2.junctionTable = options.junctionTable || '';
    options2.sourceToTargetKeyAssociation = options.sourceToTargetKeyAssociation! || {};
    options2.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation || {};
    options2.junctionToTargetAssociation = options.junctionToTargetAssociation || {};
    options2.queryModifier = options.queryModifier || options2.queryModifier;
    options2.morphIdentifier = options.morphIdentifier || '';
    options2.preAssociate = options.preAssociate || (async (obj: BaseModel) => obj);
    options2.preMtoMAssociate = options.preMtoMAssociate || undefined;
    options2.preDeleteQueryModifier = options.preDeleteQueryModifier || undefined;

    if (
      ['hasOne', 'hasMany'].includes(options2.type) &&
      Object.keys(options2.sourceToTargetKeyAssociation).length === 0
    ) {
      let model_name = Case.snake(options2.source.constructor.name);
      // @ts-ignore
      for (const key of options2.source.primaryKey) {
        options2.sourceToTargetKeyAssociation[key] = `${model_name}_${key}`;
      }
    } else if (
      options2.type === 'belongsTo' &&
      Object.keys(options2.sourceToTargetKeyAssociation).length === 0
    ) {
      let model_name = Case.snake(options2.targetModel.name);
      // @ts-ignore
      for (const key of options2.targetModel.prototype.primaryKey) {
        options2.sourceToTargetKeyAssociation[`${model_name}_${key}`] = `${key}`;
      }
    } else if (options2.type === 'belongsToMany') {
      if (options2.junctionTable === '') {
        options2.junctionTable = [
          Case.snake(options2.source.constructor.name),
          Case.snake(options2.targetModel.name),
        ]
          .sort()
          .join('_');
      }

      if (Object.keys(options2.sourceToJunctionKeyAssociation).length === 0) {
        options2.sourceToJunctionKeyAssociation = {};
        let model_name = Case.snake(options2.source.constructor.name);
        // @ts-ignore
        for (const key of options2.source.primaryKey) {
          options2.sourceToJunctionKeyAssociation[key] = `${model_name}_${key}`;
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

    if (options2.morphIdentifier) {
      let morph_type = options2.morphIdentifier + '_type';
      let morph_id = options2.morphIdentifier + '_id';
      if (['hasOne', 'hasMany'].includes(options2.type)) {
        options2.queryModifier = async (query: Query) => {
          query.whereOp(morph_type, '=', snakeCase(options2.source.getClassName()));
          query = options.queryModifier ? await options.queryModifier(query) : query;
          return query;
        };
        options2.preAssociate = async (obj: BaseModel) => {
          obj[morph_type] = snakeCase(options2.source.getClassName());
          return obj;
        };
        options2.sourceToTargetKeyAssociation = { id: morph_id };
      } else if (['belongsTo'].includes(options2.type)) {
        options2.queryModifier = async (query: Query) => {
          query.whereOp(morph_type, '=', snakeCase(options2.targetModel.getClassName()));
          query = await options2.queryModifier(query);
          return query;
        };

        options2.sourceToTargetKeyAssociation = { [morph_id]: 'id' };
      }
    }

    return options2;
  }

  static createHasOne<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManager1to1<Source, Target> {
    options.type = 'hasOne';
    return new RelationshipManager1to1<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
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

  static createBelongsToMany<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManagerMtoM<Source, Target> {
    options.type = 'belongsToMany';
    return new RelationshipManagerMtoM<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }

  static createMorphedBelongsToMany<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManagerMtoM<Source, Target> {
    options.type = 'belongsToMany';
    if (!options.source) {
      throw new Error('Source model must be provided for morphed relationships');
    }
    if (!options.targetModel) {
      throw new Error('Target model must be provided for morphed relationships');
    }
    if (!options.morphIdentifier) {
      throw new Error('Morph identifier must be provided for morphed relationships');
    }
    if (!options.junctionTable) {
      options.junctionTable = [
        Case.snake(options.source.getClassName()),
        Case.snake(options.targetModel.getClassName()),
      ]
        .sort()
        .join('_');
    }

    options.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation || {};
    options.junctionToTargetAssociation = options.junctionToTargetAssociation || {};

    if (Object.keys(options.sourceToJunctionKeyAssociation).length === 0) {
      let model_name = Case.snake(options.morphIdentifier);
      // @ts-ignore
      for (const key of options.source.primaryKey) {
        options.sourceToJunctionKeyAssociation[key] = `${model_name}_${key}`;
      }
    }

    if (Object.keys(options.junctionToTargetAssociation).length === 0) {
      let target_name = Case.snake(options.targetModel.getClassName());
      let target = new options.targetModel();
      // @ts-ignore
      for (const key of target.primaryKey) {
        options.junctionToTargetAssociation[`${target_name}_${key}`] = key;
      }
    }

    let old_queryModifier = options.queryModifier || ((query: Query) => query);

    options.queryModifier = async (query: Query) => {
      query.whereOp(
        `${options.morphIdentifier}_type`,
        '=',
        snakeCase(options.source!.getClassName())
      );
      return await old_queryModifier(query);
    };

    options.preMtoMAssociate = async (obj: Record<string, any>, target: BaseModel) => {
      obj[`${options.morphIdentifier}_type`] = snakeCase(options.source!.getClassName());

      return obj;
    };

    options.preDeleteQueryModifier = async (query: Query) => {
      query.whereOp(
        `${options.morphIdentifier}_type`,
        '=',
        snakeCase(options.source!.getClassName())
      );
      return query;
    };

    return new RelationshipManagerMtoM<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }
}
