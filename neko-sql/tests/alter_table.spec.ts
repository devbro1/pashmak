import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Connection } from '../src/Connection';
import { Schema } from '../src/Schema';
import { CompiledSql } from '../src/types';
import { Blueprint } from '../src/Blueprint';
import { SchemaGrammar } from '../src/SchemaGrammar';
import { Query } from '../src/Query';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar';
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
});
