import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { PostgresqlConnection, Connection, Query } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { faker } from '@faker-js/faker';
import { FakeConnection } from './FakeConnection';
import { Attribute, BaseModel } from '../../src';

describe('query related tests', () => {
  test('P1', async () => {
    let conn = new FakeConnection();
    BaseModel.setConnection(conn);
    class ExternalLink extends BaseModel {
      @Attribute()
      declare age: number;

      static override getQuery(): Query & { active: (active: boolean) => Query } {
        let rc = super.getQuery();
        rc.active = function (active: boolean) {
          return this.whereOp('is_active', '=', active);
        };
        return rc;
      }
    }

    expect(conn).toBeInstanceOf(FakeConnection);

    let q = ExternalLink.getQuery().active(true);
    expect(q).toBeInstanceOf(Query);

    expect(q.toSql().sql).toBe('select * from external_links where is_active = ?');
    expect(q.toSql().bindings).toEqual([true]);
  });
});
