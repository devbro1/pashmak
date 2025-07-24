import { Migration } from '@devbro/pashmak/sql';
import { Schema, Blueprint } from "@devbro/pashmak/sql";

export default class {{className}} extends Migration {
  async up(schema: Schema) {
    // await schema.createTable("{{tableName}}", (table: Blueprint) => {
    //   table.id();
    //   table.timestamps();
    // });
  }

  async down(schema: Schema) {
    // await schema.dropTable("{{tableName}}");
  }
}
