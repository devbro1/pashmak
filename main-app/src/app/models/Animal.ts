import { BaseModel, Attribute } from "neko-orm/src";

export class Animal extends BaseModel {
  @Attribute({ primaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  sound: string = "";

  @Attribute()
  weight: number = 0;
}
