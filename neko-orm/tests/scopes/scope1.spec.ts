import { describe, expect, test } from 'vitest';
import { PostgresqlConnection, Query } from '@devbro/neko-sql';
import { Connection } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { Country, Job, Region } from '../fixtures/models';
import { Attribute, BaseModel } from '../../src';
import { faker } from '@faker-js/faker';
import { sleep } from '@devbro/neko-helper';
import { GlobalScope } from '../../src/GlobalScope.mjs';
import { LocalScopeQuery } from '../../src/LocalScopeQuery.mjs';

describe('global scopes queries', () => {
  let conn: Connection;

  beforeAll(async () => {
    const randName = Date.now() + '_' + Math.random().toString(36).substring(7);
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

      public static getLocalScopesQuery() {
        return class extends LocalScopeQuery<Country> {
          protected getModel(): new () => Country {
            return Country;
          }

          region(region_id: number) {
            this.whereOp('region_id', '=', region_id);
            return this;
          }

          nameLike(name: string) {
            this.whereOp('country_name', 'ILIKE', `%${name}%`);
            return this;
          }
        };
      }
    }

    class Region2 extends GlobalScope {
      public apply(query: Query): Query {
        return query.whereOp('region_id', '=', 2);
      }
    }

    class HasIinName extends GlobalScope {
      public apply(query: Query): Query {
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

    let c1_1 = await (await Country.getQuery()).region(1).get();
    expect(c1_1.length).toBe(8);
    let c1_2 = await (await Country.getQuery()).region(2).get();
    expect(c1_2.length).toBe(5);
    let c1_3 = await (await Country.getQuery()).region(3).get();
    expect(c1_3.length).toBe(6);
    let c1_4 = await (await Country.getQuery()).region(4).get();
    expect(c1_4.length).toBe(6);
    let c1_5 = await (await Country.getQuery()).region(5).get();
    expect(c1_5.length).toBe(0);

    let c1_obj1 = await (await Country.getQuery()).region(1).getObject();
    expect(c1_obj1 instanceof Country).toBeTruthy();

    let c1_objs = await (await Country.getQuery()).region(1).getObjects();
    expect(Array.isArray(c1_objs)).toBeTruthy();
    for (let c of c1_objs) {
      expect(c instanceof Country).toBeTruthy();
    }

    let c = await Country2.findOne({ country_id: 'AR' });
    expect(c).toBeInstanceOf(Country2);
    expect(c?.region_id).toBe(2);
    expect(c?.country_id).toBe('AR');

    c = await Country2.findOne({ country_id: 'AU' });
    expect(c).toBeUndefined();

    c = await Country2.findOne({ country_id: 'AU' }, { withGlobalScopes: false });
    expect(c).toBeInstanceOf(Country2);
  });
});
