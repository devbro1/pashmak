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

describe('index schemas', () => {
  beforeAll(async () => {});

  afterAll(async () => {});

  test('create table with basic index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email');
      table.string('name');
      table.index('email');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, email varchar(255) not null, name varchar(255) not null,primary key (id)); create index users_email_index on users (email)"
    );
  });

  test('create table with unique index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email');
      table.unique('email');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, email varchar(255) not null,primary key (id)); create unique index users_email_unique on users (email)"
    );
  });

  test('create table with named index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email');
      table.index('email', 'custom_email_index');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, email varchar(255) not null,primary key (id)); create index custom_email_index on users (email)"
    );
  });

  test('create table with composite index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('first_name');
      table.string('last_name');
      table.index(['first_name', 'last_name']);
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, first_name varchar(255) not null, last_name varchar(255) not null,primary key (id)); create index users_first_name_last_name_index on users (first_name, last_name)"
    );
  });

  test('create table with multiple indexes', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email');
      table.string('username');
      table.index('email');
      table.unique('username');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table users (id serial not null, email varchar(255) not null, username varchar(255) not null,primary key (id)); create index users_email_index on users (email); create unique index users_username_unique on users (username)"
    );
  });

  test('alter table add index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.alterTable('users', (table: Blueprint) => {
      table.string('phone');
      table.index('phone');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "alter table users add column phone varchar(255) not null; create index users_phone_index on users (phone)"
    );
  });

  test('alter table add unique index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.alterTable('users', (table: Blueprint) => {
      table.unique('email', 'unique_email_constraint');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "alter table users ; create unique index unique_email_constraint on users (email)"
    );
  });

  test('alter table with column and index', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.alterTable('users', (table: Blueprint) => {
      table.string('status').default('active');
      table.dropColumn('old_field');
      table.index('status');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "alter table users add column status varchar(255) not null default 'active', drop column old_field; create index users_status_index on users (status)"
    );
  });

  test('index with custom type', async () => {
    const fakeConnection = new FakeConnection();

    const schema = new Schema(fakeConnection, new SchemaGrammar());
    await schema.createTable('posts', (table: Blueprint) => {
      table.id();
      table.text('content');
      table.index('content').indexType('gin');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      "create table posts (id serial not null, content text not null,primary key (id)); create index posts_content_index on posts using gin (content)"
    );
  });
});