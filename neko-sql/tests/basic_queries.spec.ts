import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Query } from '../src/Query.mjs';
import { QueryGrammar } from '../src/QueryGrammar.mjs';
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection.mjs';
import { Connection } from '../src/Connection.mjs';
import { execSync } from 'child_process';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
describe('raw queries', () => {
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

  test('basic select all', () => {
    const query = new Query(null, new PostgresqlQueryGrammar());
    query.table('countries');
    let r = query.toSql();

    expect(r.sql).toBe('select * from countries');
    expect(r.bindings.length).toBe(0);

    query.whereOp('region_id', '=', 2);

    r = query.toSql();

    expect(r.sql).toBe('select * from countries where region_id = $1');
    expect(r.bindings).toStrictEqual([2]);

    query.whereOp('country_id', '=', 'BE', 'or', true);

    r = query.toSql();

    expect(r.sql).toBe('select * from countries where region_id = $1 or not country_id = $2');
    expect(r.bindings).toStrictEqual([2, 'BE']);

    query.select(['country_id', 'country_name']);
    query.whereNull('country_name');
    r = query.toSql();

    expect(r.sql).toBe(
      'select country_id, country_name from countries where region_id = $1 or not country_id = $2 and country_name is null'
    );
  });

  test('basic connection functionality', async () => {
    const query = new Query(conn, new PostgresqlQueryGrammar());
    query.table('countries');
    const r = query.toSql();

    expect(r.sql).toBe('select * from countries');
    expect(r.bindings.length).toBe(0);

    let result = await query.get();
    expect(result.length).toBe(25);

    query.whereOp('country_id', '=', 'CA');
    query.whereOp('country_id', '=', 'JP', 'or');

    result = await query.get();
    expect(result.length).toBe(2);
    expect(result[0].country_name).toBe('Canada');
  });

  test('basic connection functionality v2', async () => {
    const query = new Query(conn, new PostgresqlQueryGrammar());
    query.table('jobs');
    const r = query.toSql();

    expect(r.sql).toBe('select * from jobs');
    expect(r.bindings.length).toBe(0);

    const result1 = await query.get();
    expect(result1.length).toBe(19);

    query.whereOp('job_title', 'ilike', 'P%');

    expect(query.toSql().sql).toBe('select * from jobs where job_title ilike $1');
    expect(query.toSql().bindings).toStrictEqual(['P%']);

    const result2 = await query.get();
    expect(result2.length).toBe(6);
    expect(await query.count()).toBe(6);

    query.orderBy('job_title', 'desc');
    expect(query.toSql().sql).toBe(
      'select * from jobs where job_title ilike $1 order by job_title desc'
    );

    const result3 = await query.get();
    expect(result3[0].job_id).toBe(14);
    expect(result3[1].job_id).toBe(13);
    expect(result3[2].job_id).toBe(12);
    expect(result3[3].job_id).toBe(1);
    expect(result3[4].job_id).toBe(9);
    expect(result3[5].job_id).toBe(4);

    query.limit(3);
    query.offset(2);
    expect(query.toSql().sql).toBe(
      'select * from jobs where job_title ilike $1 order by job_title desc limit 3 offset 2'
    );

    const result4 = await query.get();
    expect(result4.length).toBe(3);
    expect(result4[0].job_id).toBe(12);
    expect(result4[1].job_id).toBe(1);
    expect(result4[2].job_id).toBe(9);
  });

  test('select where in X', async () => {
    const query = new Query(conn, new PostgresqlQueryGrammar());
    query.table('regions');
    query.whereOp('region_id', 'in', [1, 2]);
    console.log(query.toSql());
    const result = await query.get();
    expect(result.length).toBe(2);
    expect(result[0].region_name).toBe('Europe');
    expect(result[1].region_name).toBe('Americas');
  });
});
