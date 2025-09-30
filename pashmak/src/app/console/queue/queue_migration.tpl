import { Migration } from '@devbro/pashmak/sql';
import { Schema, Blueprint } from "@devbro/pashmak/sql";

export default class {{className}} extends Migration {
  async up(schema: Schema) {
    await schema.createTable("{{tableName}}", (table: Blueprint) => {
      table.id();
      table.timestamps();
      table.string('channel');
      table.text('message');
      table.datetimeTz('last_tried_at').nullable(true);
      table.text('process_message').default('');
      table.string('status').default('pending');
      table.number('retried_count').default(0);
    });
  }

  async down(schema: Schema) {
    await schema.dropTableIfExists("{{tableName}}");
  }
}
