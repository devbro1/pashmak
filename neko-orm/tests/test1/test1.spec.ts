import { Connection, PostgresqlConnection, Query } from '@devbro/neko-sql';
import { faker } from '@faker-js/faker';
import { execSync } from 'child_process';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { Attribute, BaseModel } from '../../src';
import { FakeConnection } from './FakeConnection';

describe('query related tests', () => {
  test('P1', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);
    class ExternalLink extends BaseModel {
      @Attribute()
      declare age: number;

      static override getQuery(): Query & { active: (active: boolean) => Query } {
        const rc = super.getQuery();
        rc.active = function (active: boolean) {
          return this.whereOp('is_active', '=', active);
        };
        return rc;
      }
    }

    expect(conn).toBeInstanceOf(FakeConnection);

    const q = ExternalLink.getQuery().active(true);
    expect(q).toBeInstanceOf(Query);

    expect(q.toSql().sql).toBe('select * from external_links where is_active = ?');
    expect(q.toSql().bindings).toEqual([true]);
  });
});
