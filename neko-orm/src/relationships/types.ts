import { Query } from 'neko-sql/src/Query';
import { BaseModel } from '../baseModel';

export type assocationOptions = {
  sync: boolean; // if true, will save the target model right away
};

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
  sourceToJunctionKeyAssociation: Record<string, string>;
  junctionToTargetAssociation: Record<string, string>;
  queryModifier: (query: Query) => Promise<Query>;
  morphIdentifier: string;
  preAssociate: (obj: BaseModel) => Promise<BaseModel>;
  preMtoMAssociate?: (obj: Record<string, any>, target: BaseModel) => Promise<Record<string, any>>;
  preDeleteQueryModifier?: (query: Query) => Promise<Query>;
};
