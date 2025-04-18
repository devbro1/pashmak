import { BaseModel, Attribute } from '../../src';

export class Region extends BaseModel {
  protected tableName: string = 'regions';
  protected fillable: string[] = ['region_name'];
  protected primaryKey: string[] = ['region_id'];
}

export class Country extends BaseModel {
  protected tableName: string = 'countries';

  @Attribute({ primaryKey: true })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;
}

export class Job extends BaseModel {
  @Attribute()
  public title: string | undefined;

  @Attribute()
  public min_salary: number | undefined;

  @Attribute()
  public max_salary: number | undefined;
}
