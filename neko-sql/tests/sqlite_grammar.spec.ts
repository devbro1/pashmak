import { describe, expect, test } from 'vitest';
import { SqliteSchemaGrammar } from '../src/databases/sqlite/SqliteSchemaGrammar.mjs';
import { Schema } from '../src/Schema.mjs';
import { Blueprint } from '../src/Blueprint.mjs';
import { FakeConnection } from './FakeConnection';

describe('SQLite Schema Grammar', () => {
  test('should create table with uuid id column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new SqliteSchemaGrammar());

    await schema.createTable('users', (table: Blueprint) => {
      table.id({ uuid: true });
      table.string('name');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (id TEXT not null, name varchar(255) not null,primary key (id))'
    );
  });

  test('should create table with standalone uuid column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new SqliteSchemaGrammar());

    await schema.createTable('tokens', (table: Blueprint) => {
      table.id();
      table.uuid('token');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'create table tokens (id INTEGER not null, token TEXT not null,primary key (id))'
    );
  });
});
