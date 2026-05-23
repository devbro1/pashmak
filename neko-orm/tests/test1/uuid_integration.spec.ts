import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { PostgresqlConnection, Connection } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { Attribute, BaseModel, uuidV4Default } from '../../src';

describe('uuid integration tests', () => {
  let conn: Connection;

  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
      host: process.env.DB_HOST,
      database: (process.env.DB_NAME || 'test_db') + `_uuid_${randName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
    );
    execSync(
      `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_uuid_test_pg.sql ${db_config.database}`
    );
    conn = new PostgresqlConnection(db_config);
    await conn.connect();
    BaseModel.setConnection(conn);
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test('db-side uuid: DB generates UUID via DEFAULT gen_random_uuid()', async () => {
    class AuditLog extends BaseModel {
      // incrementingPrimaryKey: true — ORM omits id from INSERT and reads it back via RETURNING
      @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
      declare id: string | undefined;

      @Attribute()
      declare action: string;
    }

    const log = new AuditLog({ action: 'login' });

    // No client-side default — id must be undefined before hitting the DB
    expect(log.id).toBeUndefined();

    await log.save();

    // DB assigned a valid UUID
    expect(log.id).toBeDefined();
    expect(log.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Record is retrievable by the DB-generated id
    const found = await AuditLog.findByPrimaryKey({ id: log.id });
    expect(found.action).toBe('login');
  });

  test('db-side uuid: two records get distinct UUIDs from the DB', async () => {
    class AuditLog extends BaseModel {
      @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
      declare id: string | undefined;

      @Attribute()
      declare action: string;
    }

    const a = new AuditLog({ action: 'create' });
    const b = new AuditLog({ action: 'delete' });

    await a.save();
    await b.save();

    expect(a.id).toBeDefined();
    expect(b.id).toBeDefined();
    expect(a.id).not.toBe(b.id);
  });

  test('client-side uuid: ORM generates UUID before INSERT', async () => {
    class SessionLog extends BaseModel {
      // incrementingPrimaryKey: false — ORM generates UUID via uuidV4Default and sends it in INSERT
      @Attribute({ primaryKey: true, incrementingPrimaryKey: false, default: uuidV4Default })
      declare id: string | undefined;

      @Attribute()
      declare action: string;
    }

    const log = new SessionLog({ action: 'logout' });
    const preGeneratedId = log.id as string;

    // UUID must be present before any DB interaction
    expect(preGeneratedId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    await log.save();

    // id must be unchanged after save
    expect(log.id).toBe(preGeneratedId);

    // Record is retrievable by the client-generated id
    const found = await SessionLog.findByPrimaryKey({ id: preGeneratedId });
    expect(found.action).toBe('logout');
  });

  test('client-side uuid: two instances get distinct UUIDs without any DB call', () => {
    class SessionLog extends BaseModel {
      @Attribute({ primaryKey: true, incrementingPrimaryKey: false, default: uuidV4Default })
      declare id: string | undefined;

      @Attribute()
      declare action: string;
    }

    const a = new SessionLog({ action: 'start' });
    const b = new SessionLog({ action: 'end' });

    expect(a.id).toBeDefined();
    expect(b.id).toBeDefined();
    expect(a.id).not.toBe(b.id);
  });
});
