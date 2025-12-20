import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { MysqlConnection } from '../src/databases/mysql/MysqlConnection.mjs';

describe('MySQL basic operations', () => {
  let conn: MysqlConnection | null;

  beforeAll(async () => {
    const db_config = {
      host: process.env.MYSQL_HOST || 'localhost',
      database: process.env.MYSQL_DATABASE || 'test_db',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
    };

    conn = new MysqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
    await MysqlConnection.destroy();
  });

  test('connection should be established', () => {
    expect(conn?.isConnected()).toBe(true);
  });

  test('should execute a simple query', async () => {
    const result = await conn!.runQuery('SELECT 1 as test');
    expect(result).toBeDefined();
    expect(result[0].test).toBe(1);
  });

  test('should get query builder instance', () => {
    const query = conn!.getQuery();
    expect(query).toBeDefined();
  });

  test('should get schema builder instance', () => {
    const schema = conn!.getSchema();
    expect(schema).toBeDefined();
  });

  test('should support transactions', async () => {
    await expect(conn!.beginTransaction()).resolves.not.toThrow();
    await expect(conn!.commit()).resolves.not.toThrow();
  });

  test('should support rollback', async () => {
    await conn!.beginTransaction();
    await expect(conn!.rollback()).resolves.not.toThrow();
  });
});
