import { Migration } from 'neko-sql/src/Migration';
import { Schema, Blueprint } from "neko-sql/src";

export default class {{className}} extends Migration {
  async up(schema: Schema) {
    // await schema.createTable("{{className}}", (blueprint: Blueprint) => {
    //   blueprint.id();
    //   blueprint.timestamps();
    // });
  }

  async down(schema: Schema) {
    // await schema.dropTable("{{className}}");
  }
}
