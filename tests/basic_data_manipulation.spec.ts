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
import { faker } from '@faker-js/faker';

let conn: Connection | null;
const randName = Math.random().toString(36).substring(7);
const db_config = {
    host: process.env.DB_HOST,
    database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
};
describe("data manipulations", () => {
  beforeAll(async () => {
    console.log("creating test database", db_config.database);
    execSync(`psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`);

    conn = new PostgresqlConnection(db_config);
    await conn.connect();

    await (new Schema(conn, new SchemaGrammar())).createTable('posts', (table: Blueprint) => {
        table.id();
        table.timestamps();
        table.string('title');
        table.text('body');
        table.float('priority').default(0);
        table.string('search_order').unique();
    });
  });

  afterAll(async () => {
    await conn?.disconnect();
    await PostgresqlConnection.pool.end();
    execSync(`psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "DROP DATABASE ${db_config.database}"`);
  });

  test("general data manipulation data", async () => {
    const query = new Query( conn, new PostgresqlQueryGrammar());

    for(let i = 1; i <= 100; i++) {
      await query.table('posts').insert({
        title: faker.lorem.sentence(),
        body: faker.lorem.lines(3),
        priority: 1,
        created_at: new Date(),
        updated_at: new Date(),
        search_order: i});
    }
    const r = await query.table('posts').get();
    expect(r.length).toBe(100);

    await query.table('posts').update({priority: 4});
    const r2 = await query.table('posts').get();
    expect(r2.length).toBe(100);
    r2.forEach((row: any) => {
        expect(row.priority).toBe(4);
    });

    const query2 = new Query( conn, new PostgresqlQueryGrammar());
    expect(await query2.table('posts').whereOp('search_order','<','55').get()).toHaveLength(51);
  
    await query.table('posts').whereOp('search_order', '>', 84).delete();

    query2.clearWhere();
    query.clearWhere();

    expect(await query2.get()).toHaveLength(84);

    await query.table('posts').upsert({
      title: 'BBBBB',
      body: 'BBB BBB BBB',
      priority: 5,
      created_at: new Date(),
      updated_at: new Date(),
      search_order: 85}, ['search_order'],['title','body','priority']);

      query2.clearWhere();
      const r3 = await query2.table('posts').whereOp('search_order','=',85).get();
      expect(r3).toHaveLength(1);
      expect(r3[0].title).toBe('BBBBB');
      expect(r3[0].body).toBe('BBB BBB BBB');
      expect(r3[0].priority).toBe(5);



      query2.clearWhere();
        const r4 = await query2.table('posts').whereOp('search_order','=',32).get();
        expect(r4).toHaveLength(1);
        expect(r4[0].title).not.toBe('CCCCC');
        expect(r4[0].body).not.toBe('CCC CCC CCC');

      await query.table('posts').upsert({
        title: 'CCCCC',
        body: 'CCC CCC CCC',
        priority: 5,
        created_at: new Date(),
        updated_at: new Date(),
        search_order: 32}, ['search_order'],['title','priority']);
  
        const r5 = await query2.table('posts').whereOp('search_order','=',32).get();
        expect(r5).toHaveLength(1);
        expect(r5[0].title).toBe('CCCCC');
        expect(r5[0].priority).toBe(5);
        expect(r5[0].body).not.toBe('CCC CCC CCC');

        query2.clearWhere();
        const r6 = await query2.table('posts').whereOp('search_order','=',31).get();
        expect(r6).toHaveLength(1);
        expect(r6[0].title).not.toBe('CCCCC');
        expect(r6[0].priority).toBe(4);
        expect(r6[0].body).not.toBe('CCC CCC CCC');
    });


});
