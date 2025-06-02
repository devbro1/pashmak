import { Migration } from "neko-sql/src/Migration";
import { Schema, Blueprint } from "neko-sql/src";

export default class Users extends Migration {
  async up(schema: Schema) {
    await schema.createTable("users", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.string("email");
      blueprint.string("username");
      blueprint.string("first_name");
      blueprint.string("last_name");
      blueprint.Boolean("active").default(true);
    });
  }

  async down(schema: Schema) {
    await schema.dropTable("users");
  }
}
