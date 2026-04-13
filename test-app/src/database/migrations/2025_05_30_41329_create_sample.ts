import { Blueprint } from "@devbro/pashmak/sql";
import { Migration } from "@devbro/pashmak/sql";
import { Schema } from "@devbro/pashmak/sql";

export default class CreateAnimals extends Migration {
  async up(schema: Schema) {
    // add to db schema
  }

  async down(schema: Schema) {
    // remove from db schema
  }
}
