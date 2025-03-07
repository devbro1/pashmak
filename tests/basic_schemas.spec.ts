import { describe, expect, test } from "@jest/globals";
import { Connection } from "../src/Connection";
import { Schema } from "../src/Schema";
import { CompiledSql } from "../src/types";
import { Blueprint } from "../src/Blueprint";
import { SchemaGrammar } from "../src/SchemaGrammar";

describe("raw schemas", () => {
  beforeAll(async () => {
  });

  afterAll(async () => {
  });

  test("basic schema to create a table", async () => {
    let sql: CompiledSql = {sql: '', bindings: []};
    const fakeConnection: Connection = {
        connect: async function (): Promise<boolean>
        {
            return true;
        },
        runQuery: function (sql2: CompiledSql): Promise<any>
        {
            sql = sql2;
            return Promise.resolve([]);
        },
        disconnect: async function (): Promise<boolean>
        {
            return true;
        }
    };
    await(new Schema(fakeConnection, new SchemaGrammar())).createTable('users', (table: Blueprint) => {
        table.id();
        table.timestamps();
        table.string('email',250).unique();
        table.string('first_name').default('');
        table.string('last_name').nullable(true);
        table.float('balance').default(0);
        table.Boolean('active').default(true);
        table.integer('age');
        table.double('height');
    });

    expect(sql.sql).toBe("create table users (id serial not null, created_at timestamp not null, updated_at timestamp not null, email varchar(250) not null unique, first_name varchar(255) not null default '', last_name varchar(255) null, balance float not null default 0, active boolean not null default true, age integer not null, height not null,primary key (id))");
  });
});
