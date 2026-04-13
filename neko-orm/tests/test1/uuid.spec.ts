import { describe, expect, test } from 'vitest';
import { Attribute, BaseModel } from '../../src';
import { UUID, generateUUID, generateUUIDv4, generateUUIDv7 } from '../../src/uuid.mjs';
import { FakeConnection } from './FakeConnection';

describe('UUID support', () => {
  test('generates UUID for primary key on save', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);

    class Article extends BaseModel {
      protected hasTimestamps = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: true, uuid: true })
      declare id: UUID;

      @Attribute()
      declare title: string;
    }

    // insert returns empty, refresh SELECT returns the row
    conn.results.push([]);
    conn.results.push([{ id: '018f1234-5678-7abc-8def-000000000000', title: 'Hello' }]);

    const article = new Article({ title: 'Hello' });
    expect(article.id).toBeUndefined();

    await article.save();

    // UUID should be set on the instance (after refresh it holds the mocked value)
    expect(article.id).toBeDefined();
    expect(typeof article.id).toBe('string');

    // The INSERT query should include a UUID and not use RETURNING
    const insertSql = conn.sqls[0];
    expect(insertSql.sql).toContain('insert into articles');
    expect(insertSql.sql).toContain('id');
    expect(insertSql.sql).not.toContain('RETURNING');
    // One of the INSERT bindings should be a UUID v7
    const uuidBinding = insertSql.bindings.find(
      (b) => typeof b === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-7/i.test(b)
    );
    expect(uuidBinding).toBeDefined();
    expect(uuidBinding).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  test('uses provided UUID if already set', async () => {
    const conn = new FakeConnection();
    BaseModel.setConnection(conn);

    class Widget extends BaseModel {
      protected hasTimestamps = false;

      @Attribute({ primaryKey: true, incrementingPrimaryKey: true, uuid: true })
      declare id: UUID;

      @Attribute()
      declare name: string;
    }

    const predefinedId = '12345678-1234-7aaa-8bbb-123456789abc';
    // insert returns empty, refresh SELECT returns the row
    conn.results.push([]);
    conn.results.push([{ id: predefinedId, name: 'Widget A' }]);

    const widget = new Widget({ id: predefinedId, name: 'Widget A' });
    expect(widget.id).toBe(predefinedId);

    await widget.save();

    // Should keep the predefined UUID
    expect(widget.id).toBe(predefinedId);
    expect(conn.sqls[0].bindings).toContain(predefinedId);
  });

  test('generateUUIDv7 produces valid v7 UUIDs', () => {
    const v7 = generateUUIDv7();
    expect(v7).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const v4 = generateUUIDv4();
    expect(v4).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
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
