# @devbro/neko-sql

SQL engine for quick abstracted relational database connections.

## supported features

- data manipulation(select, insert, update, delete)
- schema manipulation(create table, alter table, ...)
- transactions
- joins

## Suported Databases

currently supported databases:

- postgresql
- sqlite
- mysql

future planned:

- mssql

## how to use

### PostgreSQL Example

```typescript
import { PostgresqlConnection } from '@devbro/neko-sql';

const conn = new PostgresqlConnection({
  host: 'localhost',
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  port: 5432,
});

await conn.connect();

// Use Query builder
const query = conn.getQuery();
const results = await query.table('users').whereOp('id', '=', 1).get();

await conn.disconnect();
```

### SQLite Example

```typescript
import { SqliteConnection } from '@devbro/neko-sql';

const conn = new SqliteConnection({
  filename: './database.db',
});

await conn.connect();

// Use Query builder
const query = conn.getQuery();
const results = await query.table('users').whereOp('id', '=', 1).get();

await conn.disconnect();
```

### MySQL Example

```typescript
import { MysqlConnection } from '@devbro/neko-sql';

const conn = new MysqlConnection({
  host: 'localhost',
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  port: 3306,
});

await conn.connect();

// Use Query builder
const query = conn.getQuery();
const results = await query.table('users').whereOp('id', '=', 1).get();

await conn.disconnect();
```

please check test classes for more robust examples

## APIs

-- TODO: add all available methods and how to use them
