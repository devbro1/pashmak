import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { Schema } from '../src/Schema.mjs';
import { CompiledSql } from '../src/types.mjs';
import { Blueprint } from '../src/Blueprint.mjs';
import { SchemaGrammar } from '../src/SchemaGrammar.mjs';
import { Query } from '../src/Query.mjs';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
import { PostgresqlSchemaGrammar, QueryGrammar } from '../src';
import { FakeConnection } from './FakeConnection';
describe('raw schemas', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  test('basic schema to create a table', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.timestamps();
      table.string('email', 250).unique();
      table.string('first_name').default('');
      table.string('last_name').nullable(true);
      table.float('balance').default(0);
      table.boolean('active').default(true);
      table.integer('age');
      table.double('height');
      table.char('blood_type');
      table.date('date_of_birth');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, created_at timestamp with time zone not null default CURRENT_TIMESTAMP, updated_at timestamp with time zone not null default CURRENT_TIMESTAMP, email varchar(250) not null unique, first_name varchar(255) not null default '', last_name varchar(255) null, balance float not null default 0, active boolean not null default true, age integer not null, height double precision not null, blood_type char not null, date_of_birth date not null,primary key (id))"
    );

    await schema.createTable('users', (table: Blueprint) => {
      table.string('email').nullable().default('ABC');
      table.primary(['email']);
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (email varchar(255) null default 'ABC',primary key (email))"
    );
  });

  test('foreign key', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.timestamps();
      table.integer('role_id');
      table.foreign('role_id').references('id').on('roles').onDelete('cascade').onUpdate('cascade');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      `create table users (id serial not null, created_at timestamp with time zone not null default CURRENT_TIMESTAMP, updated_at timestamp with time zone not null default CURRENT_TIMESTAMP, role_id integer not null,primary key (id),FOREIGN KEY (role_id) references roles(id) on delete cascade on update cascade)`
    );
  });
});
