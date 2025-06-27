import { Blueprint } from "neko-sql";
import { Migration } from "neko-sql";
import { Schema } from "neko-sql";

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
