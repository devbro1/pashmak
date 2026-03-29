import { Migration } from "@devbro/pashmak/sql";
import { Schema, Blueprint } from "@devbro/pashmak/sql";

export default class Orders extends Migration {
  async up(schema: Schema) {
    await schema.createTable("orders", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.integer("customer_id");
      blueprint
        .foreign("customer_id")
        .references("id")
        .on("users")
        .onDelete("cascade")
        .onUpdate("cascade");
    });
  }

  async down(schema: Schema) {
    await schema.dropTable("orders");
  }
}
