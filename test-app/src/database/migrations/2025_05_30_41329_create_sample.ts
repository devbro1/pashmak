import { Blueprint, Migration, type Schema } from "@devbro/pashmak/sql";

export default class CreateAnimals extends Migration {
  async up(schema: Schema) {
    // add to db schema
  }

  async down(schema: Schema) {
    // remove from db schema
  }
}
