import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection } from '@devbro/neko-sql';
import { Connection } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { Country, Job, Region } from '../fixtures/models';
import { BaseModel } from '../../src';
import { faker } from '@faker-js/faker';
import { sleep } from '@devbro/neko-helper';

describe('raw queries', () => {
  let conn: Connection;

  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
      host: process.env.DB_HOST,
      database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
    );
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_hr_db_pg.sql ${db_config.database}`
    );
    conn = new PostgresqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test('basic testing', async () => {
    BaseModel.setConnection(conn);
    class Region2 extends BaseModel {
      protected tableName: string = 'RRRRRRR';

      constructor() {
        super();
      }
    }
    const country = new Country();
    const region = new Region2();

    expect(country.getTablename()).toBe('countries');
    expect(region.getTablename()).toBe('RRRRRRR');

    const country2 = new Country({ country_name: 'Indonesia', region_id: 1 });
    expect(country2.country_name).toBe('Indonesia');
    expect(country2.region_id).toBe(1);

    const c4 = await Country.findByPrimaryKey({ country_id: 'AR' });
    expect(c4.country_id).toBe('AR');
    expect(c4.country_name).toBe('Argentina');

    const country3 = new Country({ country_name: 'ZZZZZ', region_id: 1, country_id: 'ZZ' });

    await country3.save();

    const c5 = await Country.findByPrimaryKey({ country_id: 'ZZ' });
    expect(c5.country_name).toBe('ZZZZZ');

    country3.country_name = 'ZZXZZ';
    await country3.save();

    const c6 = await Country.findByPrimaryKey({ country_id: 'ZZ' });
    expect(c6.country_name).toBe('ZZXZZ');
  });

  test('job orm', async () => {
    BaseModel.setConnection(() => conn);
    const job = await Job.find(3);
    expect(job.title).toBe('Administration Assistant');

    const jobs: Job[] = await (await Job.getQuery()).whereOp('min_salary', '>=', 10000).get();
    expect(jobs.length).toBe(3);

    const job2 = new Job();
    job2.title = 'Cat Petter';
    job2.min_salary = 1000;
    job2.max_salary = 2000;
    await job2.save();
    expect(job2.id).not.toBeUndefined();
  });

  test('time stamp testing', async () => {
    BaseModel.setConnection(() => conn);
    let res = await conn.runQuery({
      sql: 'SELECT MAX(region_id) as last_id FROM regions',
      bindings: [],
    });
    await conn.runQuery({
      sql: 'SELECT setval($1, $2, false);',
      bindings: ['regions_region_id_seq', res[0].last_id + 1],
    });

    let r1 = new Region({
      region_name: faker.location.state(),
    });

    expect(r1.created_at).toBeUndefined();
    expect(r1.updated_at).toBeUndefined();
    await r1.save();
    expect(r1.created_at).toBeDefined();
    expect(r1.updated_at).toBeDefined();
    expect(r1.created_at.toISOString()).toBe(r1.updated_at.toISOString());
    expect(r1.created_at.constructor.name).toBe('Date');
    expect(r1.updated_at.constructor.name).toBe('Date');
    let first_created = r1.created_at.toISOString();

    await sleep(1500);
    await r1.save({ updateTimestamps: false });
    expect(r1.created_at.toISOString()).toBe(r1.updated_at.toISOString());
    expect(r1.created_at.constructor.name).toBe('Date');
    expect(r1.updated_at.constructor.name).toBe('Date');

    await sleep(1500);
    await r1.save();
    expect(r1.created_at.toISOString()).not.toBe(r1.updated_at.toISOString());
    expect(r1.created_at.toISOString()).toBe(first_created);
    expect(r1.created_at.constructor.name).toBe('Date');
    expect(r1.updated_at.constructor.name).toBe('Date');
  });
});
