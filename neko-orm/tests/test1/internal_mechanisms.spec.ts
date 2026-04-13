import { describe, expect, test } from 'vitest';
import { Attribute, BaseModel } from '../../src';
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
    expect(conn.getLastSql().sql).toBe('select * from external_links where id = ? limit 1');

    let el = new ExternalLink({ age: 10 });
    await el.save();
    expect(conn.sqls[1].sql).toBe(
      'insert into external_links ( age , updated_at , created_at ) values ( ? , ? , ? ) RETURNING id'
    );

    expect(conn.sqls[1].bindings[0]).toEqual(20);
    expect(el.age).toBe(444);
  });
});
