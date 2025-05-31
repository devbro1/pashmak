import { Blueprint } from "neko-sql/src/Blueprint";
import { Migration } from "neko-sql/src/Migration";
import { Schema } from "neko-sql/src/Schema";

export default class CreateAnimals extends Migration {
  async up(schema: Schema) {
    await schema.createTable("animals", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.string("name");
      blueprint.string("sound").nullable(false).default("");
      blueprint.string("weight").default(0);
    });
  }

  async down(schema: Schema) {
    await schema.dropTable("animals");
  }
}
