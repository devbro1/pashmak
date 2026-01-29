import { describe, expect, test } from 'vitest';
import { MysqlQueryGrammar } from '../src/databases/mysql/MysqlQueryGrammar.mjs';
import { PostgresqlQueryGrammar } from '../src/databases/postgresql/PostgresqlQueryGrammar.mjs';
import { SqliteQueryGrammar } from '../src/databases/sqlite/SqliteQueryGrammar.mjs';
import { Query } from '../src/Query.mjs';

describe('Batch Insert Support', () => {
  test('should compile single insert query (MySQL)', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, { name: 'John', email: 'john@example.com' });

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? )');
    expect(sql.bindings).toStrictEqual(['John', 'john@example.com']);
  });

  test('should compile batch insert query with array (MySQL)', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ]);

    expect(sql.sql).toBe(
      'insert into users ( name , email ) values ( ? , ? ) , ( ? , ? ) , ( ? , ? )'
    );
    expect(sql.bindings).toStrictEqual([
      'John',
      'john@example.com',
      'Jane',
      'jane@example.com',
      'Bob',
      'bob@example.com',
    ]);
  });

  test('should compile single insert query (PostgreSQL)', () => {
    const grammar = new PostgresqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, { name: 'John', email: 'john@example.com' });

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? )');
    expect(sql.bindings).toStrictEqual(['John', 'john@example.com']);
  });

  test('should compile batch insert query with array (PostgreSQL)', () => {
    const grammar = new PostgresqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ]);

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? ) , ( ? , ? )');
    expect(sql.bindings).toStrictEqual([
      'John',
      'john@example.com',
      'Jane',
      'jane@example.com',
    ]);
  });

  test('should compile single insert query (SQLite)', () => {
    const grammar = new SqliteQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, { name: 'John', email: 'john@example.com' });

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? )');
    expect(sql.bindings).toStrictEqual(['John', 'john@example.com']);
  });

  test('should compile batch insert query with array (SQLite)', () => {
    const grammar = new SqliteQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsert(query, [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ]);

    expect(sql.sql).toBe(
      'insert into users ( name , email ) values ( ? , ? ) , ( ? , ? ) , ( ? , ? )'
    );
    expect(sql.bindings).toStrictEqual([
      'John',
      'john@example.com',
      'Jane',
      'jane@example.com',
      'Bob',
      'bob@example.com',
    ]);
  });

  test('should throw error for empty array', () => {
    const grammar = new MysqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');

    expect(() => grammar.compileInsert(query, [])).toThrow('Cannot insert empty array');
  });

  test('should compile insertGetId with single object (PostgreSQL)', () => {
    const grammar = new PostgresqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsertGetId(query, { name: 'John', email: 'john@example.com' });

    expect(sql.sql).toBe('insert into users ( name , email ) values ( ? , ? ) RETURNING id');
    expect(sql.bindings).toStrictEqual(['John', 'john@example.com']);
  });

  test('should compile insertGetId with array (PostgreSQL)', () => {
    const grammar = new PostgresqlQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsertGetId(query, [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ]);

    expect(sql.sql).toBe(
      'insert into users ( name , email ) values ( ? , ? ) , ( ? , ? ) RETURNING id'
    );
    expect(sql.bindings).toStrictEqual([
      'John',
      'john@example.com',
      'Jane',
      'jane@example.com',
    ]);
  });

  test('should compile insertGetId with array (SQLite)', () => {
    const grammar = new SqliteQueryGrammar();
    const query = new Query(null, grammar);
    query.table('users');
    const sql = grammar.compileInsertGetId(query, [
      { name: 'John', email: 'john@example.com' },
      { name: 'Jane', email: 'jane@example.com' },
    ]);

    expect(sql.sql).toBe(
      'insert into users ( name , email ) values ( ? , ? ) , ( ? , ? ) RETURNING id'
    );
    expect(sql.bindings).toStrictEqual([
      'John',
      'john@example.com',
      'Jane',
      'jane@example.com',
    ]);
  });
});
