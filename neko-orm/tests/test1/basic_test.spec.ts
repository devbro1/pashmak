import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection } from 'neko-sql/src/databases/postgresql/PostgresqlConnection';
import { Connection } from 'neko-sql/src/Connection';
import { execSync } from 'child_process';
import { BaseModel, Country, Region } from './models';

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
    console.log('creating test database', db_config.database);
    execSync(
      `psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
    );
    console.log('load database schema and data');
    execSync(
      `psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_hr_db_pg.sql ${db_config.database}`
    );
    conn = new PostgresqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test('basic select all', async () => {
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
});
