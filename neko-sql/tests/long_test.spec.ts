import { describe, test, expect } from 'vitest'
import { PostgresqlConnection } from '../src/databases/postgresql/PostgresqlConnection.mjs';
import { Blueprint, Connection, Schema, SchemaGrammar, SqliteConnection } from '../src';

const randName = Math.random().toString(36).substring(7);
let db_name = (process.env.DB_NAME || 'test_db') + `_${randName}`;

function getDatabaseConnections(): ([string, Connection])[] {
    let rc : ([string, Connection])[] = [];

    // postgresql
    const db_config = {
        host: process.env.DB_HOST,
        database: db_name,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
    };

    rc.push(['Postgreql', new PostgresqlConnection(db_config)]);
    
    // sqlite
    rc.push(['Sqlite3', new SqliteConnection({
        filename: `/tmp/${db_name}.db`
    })]);

    // mysql

    return rc;
}

describe('long test', () => {
  test.each(getDatabaseConnections())('Running long test for %s', async (connection_name,conn) => {
    expect(await conn.existsDatabase(db_name)).toBe(false);
    await conn.createDatabase(db_name);
    expect(await conn.existsDatabase(db_name)).toBe(true);
    await conn.connect();

    // add a table
    const schema = new Schema(conn, conn.getSchemaGrammar());
    await schema.createTable('users', (table: Blueprint) => {
        table.id();
        table.timestamps();
        table.string('email', 250).unique();
        table.string('first_name').default('');
    });

    await conn.getQuery().table('users').insert({
        email: 'test1@gmail.com',
        first_name: 'test1',
    });

    let result = (await conn.getQuery().table('users').get());

    expect(result.length).toBe(1);
    expect(result[0].email).toBe('test1@gmail.com');

    // insert 3 more rows

    await conn.getQuery().table('users').insert(
        {
            email: 'test2@gmail.com',
            first_name: 'test2',
        });
    
    await conn.getQuery().table('users').insert({
            email: 'test3@gmail.com',
            first_name: 'test3',
        });

    await conn.getQuery().table('users').insert({
            email: 'test4@gmail.com',
            first_name: 'test4',
        });

    // verify each row
    result = await conn.getQuery().table('users').orderBy('id').get();
    expect(result.length).toBe(4);
    expect(result[0].email).toBe('test1@gmail.com');
    expect(result[0].first_name).toBe('test1');
    expect(result[1].email).toBe('test2@gmail.com');
    expect(result[1].first_name).toBe('test2');
    expect(result[2].email).toBe('test3@gmail.com');
    expect(result[2].first_name).toBe('test3');
    expect(result[3].email).toBe('test4@gmail.com');
    expect(result[3].first_name).toBe('test4');

    // update second
    await conn.getQuery().table('users')
        .whereOp('email', '=', 'test2@gmail.com')
        .update({ first_name: 'updated_test2' });

    // re-verify second row
    const secondRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test2@gmail.com')
        .first();
    expect(secondRow).toBeDefined();
    expect(secondRow.first_name).toBe('updated_test2');

    // delete third row
    await conn.getQuery().table('users')
        .whereOp('email', '=', 'test3@gmail.com')
        .delete();

    // verify third row does not exists
    const thirdRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test3@gmail.com')
        .first();
    expect(thirdRow).toBeUndefined();
    
    // verify total count is now 3
    const finalResult = await conn.getQuery().table('users').get();
    expect(finalResult.length).toBe(3);

    //transaction
    await conn.beginTransaction();

    await conn.getQuery().table('users').insert({
        email: 'test5@gmail.com',
        first_name: 'test5_transaction',
    });

    let transactionRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test5@gmail.com')
        .first();
    expect(transactionRow).toBeDefined();
    expect(transactionRow.first_name).toBe('test5_transaction');

    await conn.commit();

    transactionRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test5@gmail.com')
        .first();
    expect(transactionRow).toBeDefined();
    expect(transactionRow.first_name).toBe('test5_transaction');

    await conn.beginTransaction();

        await conn.getQuery().table('users').insert({
        email: 'test6@gmail.com',
        first_name: 'test6_transaction',
    });

    transactionRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test6@gmail.com')
        .first();
    expect(transactionRow).toBeDefined();
    expect(transactionRow.first_name).toBe('test6_transaction');


    await conn.rollback();

    transactionRow = await conn.getQuery().table('users')
        .whereOp('email', '=', 'test6@gmail.com')
        .first();
    expect(transactionRow).toBeUndefined();

    await conn.disconnect();
    await conn.dropDatabase(db_name);
    expect(await conn.existsDatabase(db_name)).toBe(false);
  });
});
