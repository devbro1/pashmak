import { Query } from 'neko-sql/src/Query';
import { BaseModel } from '../baseModel';
import { RelationFactoryOptionsType } from './types';

export abstract class RelationshipManager<Source extends BaseModel, Target extends BaseModel> {
  protected sourceObject: BaseModel;
  protected targetModel: typeof BaseModel;
  protected target_keys: Record<string, string> = {}; // { id: 'post_id' }
  protected type: RelationFactoryOptionsType['type'];
  protected junctionTable: string;
  protected sourceToJunctionKeyAssociation: Record<string, string>;
  protected junctionToTargetAssociation: Record<string, string>;
  protected queryModifier: RelationFactoryOptionsType['queryModifier'];
  protected preAssociate?: (obj: BaseModel) => Promise<BaseModel>;

  constructor(options: RelationFactoryOptionsType) {
    this.type = options.type;
    this.sourceObject = options.source;
    this.targetModel = options.targetModel;
    this.target_keys = options.sourceToTargetKeyAssociation!;
    this.queryModifier = options.queryModifier;
    this.junctionTable = options.junctionTable;
    this.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation;
    this.junctionToTargetAssociation = options.junctionToTargetAssociation;
    this.preAssociate = options.preAssociate || undefined;
  }

  protected async modifyQuery(query: Query): Promise<Query> {
    return await this.queryModifier(query);
  }
  abstract getBaseQuery(): Promise<Query>;

  async getQuery(): Promise<Query> {
    let query: Query = await this.getBaseQuery();
    return await this.queryModifier(query);
  }
}
