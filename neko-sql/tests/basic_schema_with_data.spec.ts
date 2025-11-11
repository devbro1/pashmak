import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection.mjs';
import { Connection } from '../src/Connection.mjs';
import { execSync } from 'child_process';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
describe('basic schema with data', () => {
  let conn: Connection | null;

  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
      host: process.env.DB_HOST,
      database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

    console.log('creating test database', db_config.database);
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
    );
    console.log('load database schema and data');
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_hr_db_pg.sql ${db_config.database}`
    );

    conn = new PostgresqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test('table exists', async () => {
    const exists = await conn?.getSchema().tableExists('employees');
    expect(exists).toBe(true);
  });
});
