import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Connection } from '../src/Connection.mjs';
import { Schema } from '../src/Schema.mjs';
import { CompiledSql } from '../src/types.mjs';
import { Blueprint } from '../src/Blueprint.mjs';
import { SchemaGrammar } from '../src/SchemaGrammar.mjs';
import { Query } from '../src/Query.mjs';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
import { PostgresqlSchemaGrammar, QueryGrammar } from '../src';
import { FakeConnection } from './FakeConnection';
describe('alter table schemas', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  test('add and drop column', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.alterTable('users', (table: Blueprint) => {
      table.string('email', 250).unique();
      table.string('first_name').default('');
      table.dropColumn('date_of_birth');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "alter table users add column email varchar(250) not null unique, add column first_name varchar(255) not null default '', drop column date_of_birth"
    );

    await schema.alterTable('users', (table: Blueprint) => {
      table.dropColumn('email');
    });

    expect(fakeConnection.getLastSql().sql).toBe('alter table users drop column email');
  });

  test('add column with separate index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.alterTable('users', (table: Blueprint) => {
      table.string('email', 250);
      table.string('first_name').default('');
      table.index('email');
      table.unique('first_name');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "alter table users add column email varchar(250) not null, add column first_name varchar(255) not null default ''; create index users_email_index on users (email); create unique index users_first_name_unique on users (first_name)"
    );
  });
});
