import { BaseModel, Attribute } from '../../src';
import { Region } from './Region.model';

export class Country extends BaseModel {
  protected tableName: string = 'countries';
  protected hasTimestamps: boolean = false;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;

  regions(): Region[] {
    return [];
  }
}
