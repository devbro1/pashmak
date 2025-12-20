import { describe, expect, test } from 'vitest';
import { MysqlQueryGrammar } from '../src/databases/mysql/MysqlQueryGrammar.mjs';
import { MysqlSchemaGrammar } from '../src/databases/mysql/MysqlSchemaGrammar.mjs';
import { Query } from '../src/Query.mjs';
import { Schema } from '../src/Schema.mjs';
import { Blueprint } from '../src/Blueprint.mjs';
import { FakeConnection } from './FakeConnection';

describe('MySQL Query Grammar', () => {
  test('should compile basic select query', () => {
    const query = new Query(null, new MysqlQueryGrammar());
    query.table('users');
    const sql = query.toSql();

    expect(sql.sql).toBe('select * from users');
    expect(sql.bindings.length).toBe(0);
  });

  test('should compile select with where clause', () => {
    const query = new Query(null, new MysqlQueryGrammar());
    query.table('users');
    query.whereOp('id', '=', 1);
    const sql = query.toSql();

    expect(sql.sql).toBe('select * from users where id = ?');
    expect(sql.bindings).toStrictEqual([1]);
  });

  test('should compile insert query', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, { name: 'John', email: 'john@example.com' });

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? )');
    expect(sql.bindings).toStrictEqual(['John', 'john@example.com']);
  });

  test('should compile update query', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    query.whereOp('id', '=', 1);
    const sql = grammar.compileUpdate(query, { name: 'Jane' });

    expect(sql.sql).toBe('update users set name = ? where id = ?');
    expect(sql.bindings).toStrictEqual(['Jane', 1]);
  });

  test('should compile delete query', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    query.whereOp('id', '=', 1);
    const sql = grammar.compileDelete(query);

    expect(sql.sql).toBe('delete from users where id = ?');
    expect(sql.bindings).toStrictEqual([1]);
  });
});

describe('MySQL Schema Grammar', () => {
  test('should create table with basic columns', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());

    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('name');
      table.string('email');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (id INT AUTO_INCREMENT NOT NULL, name varchar(255) not null, email varchar(255) not null,primary key (id))'
    );
  });

  test('should create table with index', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());

    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email');
      table.index('email');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (id INT AUTO_INCREMENT NOT NULL, email varchar(255) not null,primary key (id)); create index users_email_index on users (email)'
    );
  });

  test('should alter table to add column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());

    await schema.alterTable('users', (table: Blueprint) => {
      table.string('phone');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'alter table users add column phone varchar(255) not null'
    );
  });
});
