import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Query } from '../src/Query';
import { QueryGrammar } from '../src/QueryGrammar';
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection';
import { Connection } from '../src/Connection';
import { execSync } from 'child_process';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar';
describe('raw queries', () => {
  let conn1: Connection | null;
  let conn2: Connection | null;

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

    conn1 = new PostgresqlConnection(db_config);
    await conn1.connect();

    conn2 = new PostgresqlConnection(db_config);
    await conn2.connect();
  });

  afterAll(async () => {
    await conn1?.disconnect();
    await conn2?.disconnect();
  });

  test('without transaction', async () => {
    const query1 = new Query(conn1, new PostgresqlQueryGrammar());
    const query2 = new Query(conn2, new PostgresqlQueryGrammar());

    query1.table('countries');
    query2.table('countries').whereOp('country_id', '=', 'DE');

    expect((await query2.get())[0].country_name).toBe('Germany');
    await query1.whereOp('country_id', '=', 'DE').update({ country_name: 'Germany Eh' });
    expect((await query2.get())[0].country_name).toBe('Germany Eh');
  });

  test('transaction with commit', async () => {
    const query1 = new Query(conn1, new PostgresqlQueryGrammar());
    const query2 = new Query(conn2, new PostgresqlQueryGrammar());

    query1.table('countries');
    query2.table('countries').whereOp('country_id', '=', 'CA');
    expect((await query2.get())[0].country_name).toBe('Canada');

    await query1.getConnection()?.beginTransaction();
    expect((await query2.get())[0].country_name).toBe('Canada');
    await query1.whereOp('country_id', '=', 'CA').update({ country_name: 'Canada Eh' });
    expect((await query2.get())[0].country_name).toBe('Canada');
    await query1.getConnection()?.commit();

    expect((await query2.get())[0].country_name).toBe('Canada Eh');
  });

  test('transaction with rollback', async () => {
    const query1 = new Query(conn1, new PostgresqlQueryGrammar());
    const query2 = new Query(conn2, new PostgresqlQueryGrammar());

    query1.table('countries');
    query2.table('countries').whereOp('country_id', '=', 'IT');

    expect((await query2.get())[0].country_name).toBe('Italy');
    await query1.getConnection()?.beginTransaction();
    expect((await query2.get())[0].country_name).toBe('Italy');
    await query1.whereOp('country_id', '=', 'IT').update({ country_name: 'Italy Eh' });
    expect((await query2.get())[0].country_name).toBe('Italy');
    await query1.getConnection()?.rollback();

    expect((await query2.get())[0].country_name).toBe('Italy');
  });

  test('transaction with rollback fail', async () => {
    const query1 = new Query(conn1, new PostgresqlQueryGrammar());
    const query2 = new Query(conn2, new PostgresqlQueryGrammar());

    query1.table('countries');
    query2.table('countries').whereOp('country_id', '=', 'UK');

    try {
      expect((await query2.get())[0].country_name).toBe('United Kingdom');

      await query1.getConnection()?.beginTransaction();
      await query1.whereOp('country_id', '=', 'UK').update({ country_name: 'United Kingdom Eh' });
      expect((await query2.get())[0].country_name).toBe('United Kingdom');

      await query1
        .whereOp('country_id', '=', 'UK')
        .update({ country_nameAAA: 'non existing field' });

      await query1.getConnection()?.commit();
      expect(1).toBe(2); // should never get to this line
    } catch (e) {
      await query1.getConnection()?.rollback();
      expect(1).toBe(1);
    }

    expect((await query2.get())[0].country_name).toBe('United Kingdom');
  });
});
