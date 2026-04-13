import { describe, expect, test } from 'vitest';
import { Attribute, BaseModel } from '../../src';
import { UUID } from '../../src/uuid.mjs';
import { FakeConnection } from './FakeConnection';

describe('UUID support', () => {
  test('UUID primary key uses insertGetId (db-level generation)', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);

    class Article extends BaseModel {
      protected hasTimestamps = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: true, uuid: true })
      declare id: UUID;

      @Attribute()
      declare title: string;
    }

    // insertGetId returns the DB-generated UUID (e.g. via RETURNING id for PostgreSQL)
    conn.results.push([{ id: '018f4e2a-b1c3-7d4e-8f5a-1234567890ab' }]);
    // refresh() SELECT
    conn.results.push([{ id: '018f4e2a-b1c3-7d4e-8f5a-1234567890ab', title: 'Hello' }]);

    const article = new Article({ title: 'Hello' });
    expect(article.id).toBeUndefined();

    await article.save();

    // The INSERT query should NOT include the id (DB generates it)
    const insertSql = conn.sqls[0];
    expect(insertSql.sql).toContain('insert into articles');
    // id should NOT be in the insert bindings (DB DEFAULT generates it)
    expect(insertSql.sql).not.toMatch(/insert into articles \( id/);
    // The UUID returned by the DB should be set on the model (via insertGetId RETURNING)
    expect(article.id).toBe('018f4e2a-b1c3-7d4e-8f5a-1234567890ab');
  });

  test('UUID primary key is flagged in _uuid_primary_key', () => {
    class Post extends BaseModel {
      protected hasTimestamps = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: true, uuid: true })
      declare id: UUID;

      @Attribute()
      declare title: string;
    }

    const post = new Post();
    expect(post._uuid_primary_key).toBe(true);
    expect(post._uuid_fields).toContain('id');
  });

  test('UUID type alias', () => {
    // UUID is just a string alias
    const id: UUID = '018f4e2a-b1c3-7d4e-8f5a-1234567890ab';
    expect(typeof id).toBe('string');
  });

  test('uuid non-primary-key field tracked in _uuid_fields', () => {
    class Event extends BaseModel {
      protected hasTimestamps = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
      declare id: number;

      @Attribute({ uuid: true })
      declare correlation_id: UUID;

      @Attribute()
      declare name: string;
    }

    const event = new Event({ id: 1, name: 'test' });
    expect(event._uuid_fields).toContain('correlation_id');
    expect(event._uuid_primary_key).toBe(false);
  });
});

