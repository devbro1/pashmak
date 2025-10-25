import { BaseModel, Attribute } from '../../src';
import { Country } from './Country.model';

export class Region extends BaseModel {
  protected tableName: string = 'regions';
  protected primaryKey: string[] = ['region_id'];
  protected hasTimestamps: boolean = true;

  country(): Country | undefined {
    return undefined;
  }

  @Attribute({
    primaryKey: true,
  })
  declare region_id: number;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  @Attribute()
  declare region_name: string;
}
