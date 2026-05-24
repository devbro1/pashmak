import { Attribute, BaseModel } from '../../src';
import type { Region } from './Region.model';

export class Country extends BaseModel {
  protected tableName: string = 'countries';
  protected hasTimestamps: boolean = false;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
  declare country_id: number;

  @Attribute()
  declare country_name: string;

  @Attribute()
  declare region_id: number;

  regions(): Region[] {
    return [];
  }
}
