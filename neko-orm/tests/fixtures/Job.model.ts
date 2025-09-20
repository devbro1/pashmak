import { BaseModel, Attribute } from '../../src';

export class Job extends BaseModel {
  protected hasTimestamps: boolean = false;

  @Attribute()
  public title: string | undefined;

  @Attribute()
  public min_salary: number | undefined;

  @Attribute()
  public max_salary: number | undefined;
}

export class JobV2 extends BaseModel {
  protected hasTimestamps: boolean = false;

  @Attribute()
  public title: string | undefined;

  @Attribute()
  public min_salary: number | undefined;

  @Attribute({
    default: 444,
  })
  declare max_salary: number;
}
