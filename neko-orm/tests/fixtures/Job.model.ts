import { BaseModel, Attribute } from '../../src';

export class Job extends BaseModel {
  @Attribute()
  public title: string | undefined;

  @Attribute()
  public min_salary: number | undefined;

  @Attribute()
  public max_salary: number | undefined;
}
