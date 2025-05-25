import { BaseModel, Attribute } from '../../src';
import { Region } from './Region.model';

export class Country extends BaseModel {
  protected tableName: string = 'countries';

  @Attribute({ primaryKey: true })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;

  regions(): Region[] {
    return [];
  }
}
