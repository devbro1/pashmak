import { describe, expect, test } from 'vitest';
import type { Blueprint } from '../src/Blueprint.mjs';
import { MysqlQueryGrammar } from '../src/databases/mysql/MysqlQueryGrammar.mjs';
import { MysqlSchemaGrammar } from '../src/databases/mysql/MysqlSchemaGrammar.mjs';
import { Query } from '../src/Query.mjs';
import { Schema } from '../src/Schema.mjs';
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
      'create table users (id INT AUTO_INCREMENT NOT NULL, name varchar(255) NOT NULL, email varchar(255) NOT NULL,primary key (id))'
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
      'create table users (id INT AUTO_INCREMENT NOT NULL, email varchar(255) NOT NULL,primary key (id)); create index users_email_index on users (email)'
    );
  });

  test('should alter table to add column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());

    await schema.alterTable('users', (table: Blueprint) => {
      table.string('phone');
    });

    expect(fakeConnection.getLastSql().sql).toBe(
      'alter table users add column phone varchar(255) NOT NULL'
    );
  });

  test('should create table with uuid column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.uuid('external_id');
    });
    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (external_id CHAR(36) NOT NULL)'
    );
  });

  test('should create table with nullable uuid column', async () => {
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, new MysqlSchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
      table.uuid('external_id').nullable();
    });
    expect(fakeConnection.getLastSql().sql).toBe('create table users (external_id CHAR(36) null)');
  });

  test('should create table with uuid column using getDefaultUuid()', async () => {
    const grammar = new MysqlSchemaGrammar();
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, grammar);
    await schema.createTable('users', (table: Blueprint) => {
      table.uuid('id').default(grammar.getDefaultUuid());
      table.primary(['id']);
    });
    expect(fakeConnection.getLastSql().sql).toBe(
      'create table users (id CHAR(36) NOT NULL default UUID(),primary key (id))'
    );
  });

  test('getDefaultUuid returns UUID() expression', () => {
    const grammar = new MysqlSchemaGrammar();
    expect(grammar.getDefaultUuid().toCompiledSql().sql).toBe('UUID()');
  });

  test('should create table with uuid column using getDefaultUuidV7()', async () => {
    const grammar = new MysqlSchemaGrammar();
    const fakeConnection = new FakeConnection();
    const schema = new Schema(fakeConnection, grammar);
    await schema.createTable('users', (table: Blueprint) => {
      table.uuid('id').default(grammar.getDefaultUuidV7());
      table.primary(['id']);
    });
    const expectedDefault =
      'LOWER(CONCAT(' +
      "LPAD(HEX((FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) >> 16) & 0xFFFFFFFF), 8, '0'), '-'," +
      "LPAD(HEX(FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) & 0xFFFF), 4, '0'), '-'," +
      "CONCAT('7', LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
      "CONCAT(ELT(1 + FLOOR(RAND() * 4), '8', '9', 'a', 'b'), LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
      "LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 12, '0')" +
      '))';
    expect(fakeConnection.getLastSql().sql).toBe(
      `create table users (id CHAR(36) NOT NULL default ${expectedDefault},primary key (id))`
    );
  });

  test('getDefaultUuidV7 returns correct MySQL expression', () => {
    const grammar = new MysqlSchemaGrammar();
    const expectedDefault =
      'LOWER(CONCAT(' +
      "LPAD(HEX((FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) >> 16) & 0xFFFFFFFF), 8, '0'), '-'," +
      "LPAD(HEX(FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) & 0xFFFF), 4, '0'), '-'," +
      "CONCAT('7', LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
      "CONCAT(ELT(1 + FLOOR(RAND() * 4), '8', '9', 'a', 'b'), LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
      "LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 12, '0')" +
      '))';
    expect(grammar.getDefaultUuidV7().toCompiledSql().sql).toBe(expectedDefault);
  });
});
