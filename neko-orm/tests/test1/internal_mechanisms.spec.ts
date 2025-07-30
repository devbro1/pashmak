import { describe, expect, test } from '@jest/globals';
import { Attribute, BaseModel } from '../../src';
import { FakeConnection } from './FakeConnection';

describe('raw queries', () => {
  test('table name', async () => {
    let conn = new FakeConnection();

    BaseModel.setConnection(conn);
    class ExternalLink extends BaseModel {
      @Attribute({
        caster: async (v: any) => v * 2,
        mutator: async (v: any) => v / 2,
      })
      declare age: number;
    }

    conn.results.push([{ id: 1, age: 10 }]);
    conn.results.push([{ id: 2 }]);
    conn.results.push([{ id: 2, age: 888 }]);

    await ExternalLink.findOne({ id: 1 });
    expect(conn.getLastSql().sql).toBe('select * from external_links where id = $1 limit 1');

    let el = new ExternalLink({ age: 10 });
    await el.save();
    expect(conn.sqls[1].sql).toBe(
      'insert into external_links (age, updated_at, created_at) values ($1,$2,$3) RETURNING id'
    );
    expect(conn.sqls[1].bindings[0]).toEqual(20);
    expect(el.age).toBe(444);
  });
});
