import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Connection } from '../src/Connection.mjs';
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection.mjs';

describe('database management', () => {
  let conn: Connection | null;
  const testDbName = 'test_db_management_' + Math.random().toString(36).substring(7);

  const db_config = {
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to postgres database to manage other databases
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  };

  beforeAll(async () => {
    conn = new PostgresqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
    await PostgresqlConnection.pool.end();
  });

  test('createDatabase creates a new database', async () => {
    // Create the database
    await conn!.createDatabase(testDbName);

    // Verify the database exists by querying the system catalog
    const result = await conn!.runQuery({
      sql: 'SELECT 1 FROM pg_database WHERE datname = $1',
      bindings: [testDbName],
      parts: ['SELECT', '1', 'FROM', 'pg_database', 'WHERE', 'datname', '=', '$1'],
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(1);
  });

  test('dropDatabase removes an existing database', async () => {
    // Drop the database
    await conn!.dropDatabase(testDbName);

    // Verify the database no longer exists
    const result = await conn!.runQuery({
      sql: 'SELECT 1 FROM pg_database WHERE datname = $1',
      bindings: [testDbName],
      parts: ['SELECT', '1', 'FROM', 'pg_database', 'WHERE', 'datname', '=', '$1'],
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });
});
