import { describe, expect, test } from "@jest/globals";
import { Query } from "../src/Query";
import { Grammar } from "../src/Grammar";
import { PostgresqlConnection } from "../src/databases/postgresql/PostgresqlConnection";
import { Connection } from "../src/Connection";

describe("raw queries", () => {
  let conn: Connection | null;
  beforeEach(async () => {
    conn = new PostgresqlConnection();
    await conn.connect();
  });

  afterEach(async () => {
    await conn?.disconnect();
  })

  test("basic select all", () => {
    let query = new Query( null, new Grammar());
    query.table('table1');
    let r = query.toSql();

    expect(r.sql).toBe("select * from table1");
    expect(r.bindings.length).toBe(0);

    query.whereOp('column1','=',1234);

    r = query.toSql();

    expect(r.sql).toBe("select * from table1 where column1 = ?");
    expect(r.bindings).toStrictEqual([1234]);


    query.whereOp('column2','=',222, 'or', true);

    r = query.toSql();

    expect(r.sql).toBe("select * from table1 where column1 = ? or not column2 = ?");
    expect(r.bindings).toStrictEqual([1234,222]);
  });

  test("basic connection functionality", async () => {
    let query = new Query( conn, new Grammar());
    query.table('users');
    let r = query.toSql();

    expect(r.sql).toBe("select * from users");
    expect(r.bindings.length).toBe(0);

    let result = await query.get();
    expect(result.length).toBe(11);

    query.whereOp('first_name','=','super');
    query.whereOp('last_name','=','admin');

    result = await query.get();
    expect(result.length).toBe(1);
    expect(result[0].first_name).toBe('super');
  });

  test("basic connection functionality v2", async () => {
    let query = new Query( conn, new Grammar());
    query.table('clients');
    let r = query.toSql();

    expect(r.sql).toBe("select * from clients");
    expect(r.bindings.length).toBe(0);

    let result = await query.get();
    expect(result.length).toBe(1);

    result = await query.get();
    expect(result.length).toBe(1);
  });
});
