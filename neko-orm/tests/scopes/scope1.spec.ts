import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection, Query } from '@devbro/neko-sql';
import { Connection } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { Country, Job, Region } from '../fixtures/models';
import { Attribute, BaseModel } from '../../src';
import { faker } from '@faker-js/faker';
import { sleep } from '@devbro/neko-helper';
import { GlobalScope } from '../../src/GlobalScope';

describe('global scopes queries', () => {
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

    class Country extends BaseModel {
      protected tableName: string = 'countries';
      protected hasTimestamps: boolean = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
      public country_id: number | undefined;

      @Attribute()
      public country_name: string | undefined;

      @Attribute()
      public region_id: number | undefined;

      regions(): Region[] {
        return [];
      }
    }

    class Region2 extends GlobalScope {
      public async apply(query: Query): Promise<Query> {
        return query.whereOp('region_id', '=', 2);
      }
    }

    class HasIinName extends GlobalScope {
      public async apply(query: Query): Promise<Query> {
        return query.whereOp('country_name', 'ILIKE', '%I%');
      }
    }

    class Country2 extends BaseModel {
      protected tableName: string = 'countries';
      protected hasTimestamps: boolean = false;
      scopes = [Region2];

      @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
      public country_id: number | undefined;

      @Attribute()
      public country_name: string | undefined;

      @Attribute()
      public region_id: number | undefined;

      regions(): Region[] {
        return [];
      }
    }

    class Country3 extends Country2 {
      scopes = [Region2, HasIinName];
    }

    let c1 = await (await Country.getQuery()).get();
    expect(c1.length).toBe(25);

    let c2 = await (await Country2.getQuery()).get();
    expect(c2.length).toBe(5);
    c2.forEach((c: Country2) => {
      expect(c.region_id).toBe(2);
    });

    let c3 = await (await Country3.getQuery()).get();
    expect(c3.length).toBe(4);
    c3.forEach((c: Country3) => {
      expect(c.region_id).toBe(2);
      expect(c.country_name?.toLowerCase().includes('i')).toBeTruthy();
    });
  });
});
