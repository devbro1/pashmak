import { Query } from 'neko-sql/src/Query';
import { BaseModel } from '../baseModel';
import { Case } from 'change-case-all';
import { RelationshipManager1toM } from './RelationshipManager1toM';
import { RelationshipManagerMto1 } from './RelationshipManagerMto1';
import { RelationshipManagerMtoM } from './RelationshipManagerMtoM';
import { RelationFactoryOptionsType } from './types';

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
  //   options2.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation || {};
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
      sourceToJunctionKeyAssociation: {},
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
    options2.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation || {};
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
    } else if (
      options2.type === 'belongsTo' &&
      Object.keys(options2.sourceToTargetKeyAssociation).length === 0
    ) {
      options2.sourceToTargetKeyAssociation = {};
      let model_name = Case.snake(options2.targetModel.name);
      // @ts-ignore
      for (const key of options2.targetModel.primaryKey) {
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

  static createBelongsToMany<Source extends BaseModel, Target extends BaseModel>(
    options: Partial<RelationFactoryOptionsType>
  ): RelationshipManagerMtoM<Source, Target> {
    options.type = 'belongsToMany';
    return new RelationshipManagerMtoM<Source, Target>(
      RelationshipFactory.populateOptions(options)
    );
  }
}
