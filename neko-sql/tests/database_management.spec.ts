import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Connection } from '../src/Connection.mjs';
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection.mjs';

describe('database management', () => {
  let conn: Connection | null;
  // Use timestamp + random string for better uniqueness in parallel test runs
  const testDbName =
    'test_db_mgmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

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

  test('createDatabase and removeDatabase', async () => {
    // Create the database
    await conn!.createDatabase(testDbName);

    // Verify the database exists by querying the system catalog
    let result = await conn!.runQuery({
      sql: 'SELECT 1 FROM pg_database WHERE datname = $1',
      bindings: [testDbName],
      parts: ['SELECT', '1', 'FROM', 'pg_database', 'WHERE', 'datname', '=', '$1'],
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(1);

    // Drop the database
    await conn!.dropDatabase(testDbName);

    // Verify the database no longer exists
    result = await conn!.runQuery({
      sql: 'SELECT 1 FROM pg_database WHERE datname = $1',
      bindings: [testDbName],
      parts: ['SELECT', '1', 'FROM', 'pg_database', 'WHERE', 'datname', '=', '$1'],
    });

    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  test('createDatabase rejects invalid database names', async () => {
    // Test invalid names that should be rejected
    const invalidNames = [
      'test-db',
      'test db',
      'test;db',
      'test"db',
      "test'db",
      '123test', // Can't start with digit
      'test.db',
      'test/db',
    ];

    for (const invalidName of invalidNames) {
      await expect(conn!.createDatabase(invalidName)).rejects.toThrow(/Invalid identifier/);
    }
  });

  test('listDatabases returns array of database names', async () => {
    // Create a test database first
    const tempDbName =
      'test_list_db_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    await conn!.createDatabase(tempDbName);

    // List all databases
    const databases = await conn!.listDatabases();

    // Verify it returns an array and includes our test database
    expect(Array.isArray(databases)).toBe(true);
    expect(databases.length).toBeGreaterThan(0);
    expect(databases).toContain(tempDbName);

    // Clean up
    await conn!.dropDatabase(tempDbName);
  });

  test('existsDatabase returns true for existing database', async () => {
    // Create a test database first
    const tempDbName =
      'test_exists_db_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    await conn!.createDatabase(tempDbName);

    // Check if it exists
    const exists = await conn!.existsDatabase(tempDbName);
    expect(exists).toBe(true);

    // Clean up
    await conn!.dropDatabase(tempDbName);
  });

  test('existsDatabase returns false for non-existing database', async () => {
    const nonExistentDb = 'non_existent_db_' + Date.now();

    // Check if it exists
    const exists = await conn!.existsDatabase(nonExistentDb);
    expect(exists).toBe(false);
  });
});
