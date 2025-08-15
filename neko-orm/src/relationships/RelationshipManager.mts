import { Query } from '@devbro/neko-sql';
import { BaseModel } from '../baseModel.mjs';
import { RelationFactoryOptionsType } from './types.mjs';

export abstract class RelationshipManager<Source extends BaseModel, Target extends BaseModel> {
  protected sourceObject: BaseModel;
  protected targetModel: typeof BaseModel;
  protected target_keys: Record<string, string> = {}; // { id: 'post_id' }
  protected type: RelationFactoryOptionsType['type'];
  protected junctionTable: string;
  protected sourceToJunctionKeyAssociation: Record<string, string>;
  protected junctionToTargetAssociation: Record<string, string>;

  protected morphIdentifier: RelationFactoryOptionsType['morphIdentifier'] = '';
  protected queryModifier: RelationFactoryOptionsType['queryModifier'];
  protected preAssociate?: RelationFactoryOptionsType['preAssociate'];
  protected preDeleteQueryModifier?: RelationFactoryOptionsType['preDeleteQueryModifier'];
  protected preMtoMAssociate?: RelationFactoryOptionsType['preMtoMAssociate'];

  constructor(options: RelationFactoryOptionsType) {
    this.type = options.type;
    this.sourceObject = options.source;
    this.targetModel = options.targetModel;
    this.target_keys = options.sourceToTargetKeyAssociation!;
    this.queryModifier = options.queryModifier;
    this.junctionTable = options.junctionTable;
    this.sourceToJunctionKeyAssociation = options.sourceToJunctionKeyAssociation;
    this.junctionToTargetAssociation = options.junctionToTargetAssociation;
    this.morphIdentifier = options.morphIdentifier || '';
    this.preAssociate = options.preAssociate || undefined;
    this.preMtoMAssociate = options.preMtoMAssociate || undefined;
    this.preDeleteQueryModifier = options.preDeleteQueryModifier || undefined;
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
