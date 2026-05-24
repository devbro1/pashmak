import { describe, expect, test } from 'vitest';
import { Attribute, BaseModel, uuidV4Default } from '../../src';
import { FakeConnection } from './FakeConnection';

describe('raw queries', () => {
  test('table name', async () => {
    const conn = new FakeConnection();

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
    expect(conn.getLastSql().sql).toBe('select * from external_links where id = ? limit 1');

    const el = new ExternalLink({ age: 10 });
    await el.save();
    expect(conn.sqls[1].sql).toBe(
      'insert into external_links ( age , updated_at , created_at ) values ( ? , ? , ? ) RETURNING id'
    );

    expect(conn.sqls[1].bindings[0]).toEqual(20);
    expect(el.age).toBe(444);
  });

  test('uuid primary key: auto-generates unique id per instance', () => {
    class Event extends BaseModel {
      @Attribute({ primaryKey: true, incrementingPrimaryKey: false, default: uuidV4Default })
      declare id: string | undefined;

      @Attribute()
      declare name: string;
    }

    const e1 = new Event();
    const e2 = new Event();

    expect(typeof e1.id).toBe('string');
    expect(e1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(e1.id).not.toBe(e2.id);
  });

  test('uuid primary key: save() sends uuid in INSERT params', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);

    class Event extends BaseModel {
      @Attribute({ primaryKey: true, incrementingPrimaryKey: false, default: uuidV4Default })
      declare id: string | undefined;

      @Attribute()
      declare name: string;
    }

    const e = new Event({ name: 'launch' });
    const generatedId = e.id as string;

    conn.results.push([]); // for insert()
    conn.results.push([{ id: generatedId, name: 'launch' }]); // for refresh()

    await e.save();

    const insertSql = conn.sqls[0];
    expect(insertSql.sql).toBe(
      'insert into events ( id , name , updated_at , created_at ) values ( ? , ? , ? , ? )'
    );
    expect(insertSql.bindings[0]).toBe(generatedId);
    expect(e.id).toBe(generatedId);
  });

  test('callable default: each instance gets a fresh value', () => {
    let counter = 0;

    class Item extends BaseModel {
      @Attribute({ default: () => ++counter })
      declare seq: number;
    }

    const a = new Item();
    const b = new Item();

    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
  });
});
