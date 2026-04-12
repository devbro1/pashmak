import { BaseModel, Attribute } from "@devbro/pashmak/orm";

export class {{className}}Model extends BaseModel {
  static tableName = "{{tableName}}";

  @Attribute({ primaryKey: true })
  declare id: number;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;
}
