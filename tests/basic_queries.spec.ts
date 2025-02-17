import { describe, expect, test } from "@jest/globals";
import { Query } from "../src/Query";
import { Grammar } from "../src/Grammar";

describe("raw queries", () => {
  beforeEach(() => {

  });

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
});
