import { BaseModel, Attribute } from '../../src';
import { Country } from './Country.model';

export class Region extends BaseModel {
  protected tableName: string = 'regions';
  protected fillable: string[] = ['region_name'];
  protected primaryKey: string[] = ['region_id'];

  country(): Country | undefined {
    return undefined;
  }
}
