import { describe, expect, test } from "@jest/globals";
import { Connection } from "../src/Connection";
import { Schema } from "../src/Schema";
import { CompiledSql } from "../src/types";
import { Blueprint } from "../src/Blueprint";
import { SchemaGrammar } from "../src/SchemaGrammar";
import { PostgresqlConnection } from "../src/databases/postgresql/PostgresqlConnection";
import { execSync } from "child_process";
import { PostgresqlQueryGrammar } from "../src/databases/postgresql/PostgresqlQueryGrammar";
import { Query } from "../src/Query";

let conn: Connection | null;
describe("data manipulations", () => {
  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
        host: process.env.DB_HOST,
        database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    };

    console.log("creating test database", db_config.database);
    execSync(`psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`);

    conn = new PostgresqlConnection(db_config);
    await conn.connect();

    new Schema(conn, new SchemaGrammar()).createTable('posts', (table: Blueprint) => {
        table.id();
        table.timestamps();
        table.string('title');
        table.text('body');
        table.integer('priority').default(0);
    });
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test("general data mod data", async () => {
    const query = new Query( conn, new PostgresqlQueryGrammar());

    await query.table('posts').insert({title: 'test', body: 'test body', priority: 1, created_at: new Date(), updated_at: new Date()});
    await query.table('posts').insert({title: 'test 2', body: 'test body 2', priority: 3, created_at: new Date(), updated_at: new Date()});
    await query.table('posts').insert({title: 'test 3', body: 'test body 3', priority: 2, created_at: new Date(), updated_at: new Date()});

    const r = await query.table('posts').get();
    expect(r.length).toBe(3);

    await query.table('posts').update({priority: 4});
    const r2 = await query.table('posts').get();
    expect(r2.length).toBe(3);
    r2.forEach((row: any) => {
        expect(row.priority).toBe(4);
    });

  });
});
