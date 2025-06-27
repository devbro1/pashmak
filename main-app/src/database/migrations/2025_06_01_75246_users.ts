import { Migration } from "neko-sql";
import { Schema, Blueprint } from "neko-sql";
import { User } from "@root/app/models/User";

export default class Users extends Migration {
  async up(schema: Schema) {
    await schema.createTable("users", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.string("email");
      blueprint.string("username");
      blueprint.string("password");
      blueprint.string("first_name");
      blueprint.string("last_name");
      blueprint.Boolean("active").default(true);
    });

    const user = new User({
      username: "admin@devbro.com",
      email: "admin@devbro.com",
      first_name: "Pashmak",
      last_name: "The Great",
      password: "Pass1234@",
    });

    await user.save();
  }

  async down(schema: Schema) {
    await schema.dropTable("users");
  }
}
