import { BaseModel, Attribute } from "neko-orm/src";
import { encryptPassword, isBcryptHash } from 'neko-helper/src/crypto';

export class User extends BaseModel {

  protected guarded: string[] = ['password'];
  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare username: string;

  @Attribute()
  declare first_name: string;

  @Attribute()
  declare last_name: string;

  @Attribute()
  active: boolean = true;

  @Attribute()
  declare password: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  @Attribute()
  declare email: string;

  async setPassword(password: string) {
    this.password = await encryptPassword(password);
  }

  async save() {
    if(!isBcryptHash(this.password)) {
      await this.setPassword(this.password);
    }
    await super.save();
  }
}
