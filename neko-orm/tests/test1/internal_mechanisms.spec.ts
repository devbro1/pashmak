import { describe, expect, test } from 'vitest';
import { Attribute, BaseModel, uuidV4Default } from '../../src';
import { FakeConnection } from './FakeConnection';

describe('dirty detection', () => {
  class Post extends BaseModel {
    @Attribute()
    declare title: string;

    @Attribute()
    declare body: string;
  }

  test('isDirty() returns false for a new instance with no changes', () => {
    const post = new Post();
    expect(post.isDirty()).toBe(false);
  });

  test('isDirty() returns true after setting an attribute', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isDirty()).toBe(true);
  });

  test('isDirty(string) returns true for the changed attribute', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isDirty('title')).toBe(true);
    expect(post.isDirty('body')).toBe(false);
  });

  test('isDirty(string[]) returns true if any given attribute was changed', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isDirty(['title', 'body'])).toBe(true);
    expect(post.isDirty(['body'])).toBe(false);
  });

  test('isClean() returns true for a new instance with no changes', () => {
    const post = new Post();
    expect(post.isClean()).toBe(true);
  });

  test('isClean() returns false after setting an attribute', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isClean()).toBe(false);
  });

  test('isClean(string) returns false for the changed attribute and true for unchanged', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isClean('title')).toBe(false);
    expect(post.isClean('body')).toBe(true);
  });

  test('isClean(string[]) returns false if any given attribute was changed', () => {
    const post = new Post();
    post.title = 'Hello';
    expect(post.isClean(['title', 'body'])).toBe(false);
    expect(post.isClean(['body'])).toBe(true);
  });

  test('isDirty() returns false after save clears dirties', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);

    class Article extends BaseModel {
      @Attribute()
      declare title: string;
    }

    conn.results.push([{ id: 1 }]);
    conn.results.push([{ id: 1, title: 'Saved' }]);

    const article = new Article({ title: 'Draft' });
    expect(article.isDirty()).toBe(true);
    await article.save();
    expect(article.isDirty()).toBe(false);
    expect(article.isClean()).toBe(true);
  });
});

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
