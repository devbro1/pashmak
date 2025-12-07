import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SqliteConnection } from '../src/databases/sqlite/SqliteConnection.mjs';
import * as fs from 'fs';

const TEST_DB = `/tmp/test_sqlite_${Math.random().toString(36).substring(7)}.db`;

describe('SQLite Connection Tests', () => {
  afterAll(() => {
    // Cleanup test database
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  it('should create and connect to SQLite database', async () => {
    const conn = new SqliteConnection({ filename: TEST_DB });
    await conn.connect();
    expect(conn.isConnected()).toBe(true);
    await conn.disconnect();
  });

  it('should execute basic queries', async () => {
    const conn = new SqliteConnection({ filename: TEST_DB });
    await conn.connect();

    // Create table
    await conn.runQuery({
      sql: 'CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)',
      bindings: [],
      parts: ['CREATE', 'TABLE', 'IF', 'NOT', 'EXISTS', 'test_table', '(id', 'INTEGER', 'PRIMARY', 'KEY,', 'name', 'TEXT)'],
    });

    // Insert data
    await conn.runQuery({
      sql: 'INSERT INTO test_table (name) VALUES (?)',
      bindings: ['test_name'],
      parts: [],
    });

    // Query data
    const result = await conn.runQuery({
      sql: 'SELECT * FROM test_table WHERE name = ?',
      bindings: ['test_name'],
      parts: [],
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('test_name');

    await conn.disconnect();
  });

  it('should support transactions', async () => {
    const conn = new SqliteConnection({ filename: TEST_DB });
    await conn.connect();

    await conn.beginTransaction();
    
    await conn.runQuery({
      sql: 'INSERT INTO test_table (name) VALUES (?)',
      bindings: ['transaction_test'],
      parts: [],
    });

    await conn.commit();

    const result = await conn.runQuery({
      sql: 'SELECT * FROM test_table WHERE name = ?',
      bindings: ['transaction_test'],
      parts: [],
    });

    expect(result.length).toBe(1);

    await conn.disconnect();
  });

  it('should use Query builder', async () => {
    const conn = new SqliteConnection({ filename: TEST_DB });
    await conn.connect();

    const query = conn.getQuery();
    query.table('test_table').whereOp('name', '=', 'test_name');
    const compiledSql = query.toSql();

    expect(compiledSql.sql).toContain('select');
    expect(compiledSql.sql).toContain('from test_table');
    expect(compiledSql.sql).toContain('where');

    await conn.disconnect();
  });

  it('should use Schema builder', async () => {
    const conn = new SqliteConnection({ filename: TEST_DB });
    await conn.connect();

    const schema = conn.getSchema();
    
    // Verify that we can get a schema object with correct grammar
    expect(schema).toBeDefined();
    expect(conn.getSchemaGrammar()).toBeDefined();
    expect(conn.getSchemaGrammar().constructor.name).toBe('SqliteSchemaGrammar');

    await conn.disconnect();
  });
});
