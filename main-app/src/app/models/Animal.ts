import { BaseModel, Attribute } from "neko-orm";

export class Animal extends BaseModel {
  @Attribute({ primaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  sound: string = "";

  @Attribute()
  weight: number = 0;

  @Attribute()
  declare created_at: any;

  @Attribute()
  declare updated_at: any;
}
