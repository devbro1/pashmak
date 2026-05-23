import { describe, expect, test } from 'vitest';
import { SqliteSchemaGrammar } from '../src/databases/sqlite/SqliteSchemaGrammar.mjs';
import { Schema } from '../src/Schema.mjs';
import { Blueprint } from '../src/Blueprint.mjs';
import { FakeConnection } from './FakeConnection';

describe('SQLite Schema Grammar', () => {
  test('should create table with uuid column', async () => {
    const fakeConnection = new FakeConnection();
    fakeConnection.setSchemaGrammar(new SqliteSchemaGrammar());

    await fakeConnection.getSchema().createTable('users', (table: Blueprint) => {
      table.uuid('external_id');
    });
    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (external_id varchar(36) not null)'
    );
  });

  test('should create table with uuid column with default value', async () => {
    const fakeConnection = new FakeConnection();
    fakeConnection.setSchemaGrammar(new SqliteSchemaGrammar());
    await fakeConnection.getSchema().createTable('users', (table: Blueprint) => {
      table.uuid('external_id').default(fakeConnection.getSchemaGrammar().getDefaultUuid());
    });
    expect(fakeConnection.getLastSql().sql).toBe(
      `create table users (external_id varchar(36) not null default lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))`
    );
  });

  test('should create table with nullable uuid column', async () => {
    const fakeConnection = new FakeConnection();
    fakeConnection.setSchemaGrammar(new SqliteSchemaGrammar());

    await fakeConnection.getSchema().createTable('users', (table: Blueprint) => {
      table.uuid('external_id').nullable();
    });
    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (external_id varchar(36) null)'
    );
  });

  test('should create table with uuid column using getDefaultUuid()', async () => {
    const fakeConnection = new FakeConnection();
    fakeConnection.setSchemaGrammar(new SqliteSchemaGrammar());
    await fakeConnection.getSchema().createTable('users', (table: Blueprint) => {
      table.uuid('id').default(fakeConnection.getSchemaGrammar().getDefaultUuid());
      table.primary(['id']);
    });
    const expectedDefault =
      "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))";
    expect(fakeConnection.getLastSql().sql).toBe(
      `create table users (id varchar(36) not null default ${expectedDefault},primary key (id))`
    );
  });

  test('getDefaultUuid returns correct SQLite expression', () => {
    const grammar = new SqliteSchemaGrammar();
    expect(grammar.getDefaultUuid().toCompiledSql().sql).toBe(
      "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || '4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))"
    );
  });

  test('should create table with uuid column using getDefaultUuidV7()', async () => {
    const grammar = new SqliteSchemaGrammar();
    const fakeConnection = new FakeConnection();
    fakeConnection.setSchemaGrammar(grammar);
    await fakeConnection.getSchema().createTable('users', (table: Blueprint) => {
      table.uuid('id').default(grammar.getDefaultUuidV7());
      table.primary(['id']);
    });
    const expectedDefault =
      "lower(printf('%08x', (cast(unixepoch('subsec') * 1000 as integer) >> 16) & 0xffffffff) || '-' || " +
      "printf('%04x', cast(unixepoch('subsec') * 1000 as integer) & 0xffff) || '-' || " +
      "'7' || substr(hex(randomblob(2)), 2) || '-' || " +
      "substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || " +
      'hex(randomblob(6)))';
    expect(fakeConnection.getLastSql().sql).toBe(
      `create table users (id varchar(36) not null default ${expectedDefault},primary key (id))`
    );
  });

  test('getDefaultUuidV7 returns correct SQLite expression', () => {
    const grammar = new SqliteSchemaGrammar();
    const expectedDefault =
      "lower(printf('%08x', (cast(unixepoch('subsec') * 1000 as integer) >> 16) & 0xffffffff) || '-' || " +
      "printf('%04x', cast(unixepoch('subsec') * 1000 as integer) & 0xffff) || '-' || " +
      "'7' || substr(hex(randomblob(2)), 2) || '-' || " +
      "substr('89ab', abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || " +
      'hex(randomblob(6)))';
    expect(grammar.getDefaultUuidV7().toCompiledSql().sql).toBe(expectedDefault);
  });
});
