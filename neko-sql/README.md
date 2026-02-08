# @devbro/neko-sql

A powerful, type-safe SQL query builder and database abstraction layer for Node.js and TypeScript. Build queries programmatically with a fluent API and support for multiple database engines.

## Installation

```bash
npm install @devbro/neko-sql
```

## Features

- 🎯 **Unified API** - Same interface for PostgreSQL, MySQL, and SQLite
- 🔨 **Query Builder** - Fluent, chainable API for building SQL queries
- 🛡️ **Type-Safe** - Full TypeScript support with type inference
- 🔄 **Transactions** - Complete transaction support with rollback
- 🔗 **Joins** - Support for all join types (inner, left, right, cross)
- 📊 **Schema Builder** - Create and modify database schemas
- 🚀 **Migration Ready** - Built-in support for database migrations
- ⚡ **Async/Await** - Modern promise-based API
- 🔒 **SQL Injection Protection** - Parameterized queries by default

## Supported Databases

### Currently Supported

- ✅ **PostgreSQL** - v9.5+
- ✅ **MySQL** - v5.7+ / MariaDB v10.2+
- ✅ **SQLite** - v3.8+

### Planned Support

- 🔜 **Microsoft SQL Server** (MSSQL)

## Quick Start

### PostgreSQL

```typescript
import { PostgresqlConnection } from '@devbro/neko-sql';

// Create connection
const conn = new PostgresqlConnection({
  host: 'localhost',
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  port: 5432,
});

// Connect to database
await conn.connect();

// Execute a simple query
const users = await conn.getQuery().table('users').whereOp('status', '=', 'active').get();

console.log(users);

// Don't forget to disconnect
await conn.disconnect();
```

### SQLite

```typescript
import { SqliteConnection } from '@devbro/neko-sql';

const conn = new SqliteConnection({
  filename: './database.db',
  // Or use in-memory database
  // filename: ':memory:',
});

await conn.connect();

const users = await conn.getQuery().table('users').whereOp('age', '>', 18).get();

await conn.disconnect();
```

### MySQL

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

const activeUsers = await conn
  .getQuery()
  .table('users')
  .whereOp('is_active', '=', true)
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();

await conn.disconnect();
```

## Query Builder API

### Basic Queries

#### Select

```typescript
const query = conn.getQuery();

// Select all columns
const allUsers = await query.table('users').get();

// Select specific columns
const users = await query.table('users').select(['id', 'name', 'email']).get();

// Select first record
const user = await query.table('users').whereOp('id', '=', 1).first();

// Count records
const count = await query.table('users').whereOp('status', '=', 'active').count();
```

#### Insert

```typescript
// Insert single record
await query.table('users').insert({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

// Insert and get ID
const userId = await query.table('users').insertGetId({
  name: 'Jane Smith',
  email: 'jane@example.com',
});

// Batch insert (multiple records)
await query.table('users').insert([
  { name: 'User 1', email: 'user1@example.com' },
  { name: 'User 2', email: 'user2@example.com' },
  { name: 'User 3', email: 'user3@example.com' },
]);

// Batch insert and get IDs
const ids = await query.table('users').insertGetId([
  { name: 'User A', email: 'a@example.com' },
  { name: 'User B', email: 'b@example.com' },
]);
```

#### Update

```typescript
// Update records
await query.table('users').whereOp('id', '=', 1).update({
  name: 'Updated Name',
  updated_at: new Date(),
});

// Update multiple records
await query.table('users').whereOp('status', '=', 'pending').update({ status: 'active' });
```

#### Delete

```typescript
// Delete specific record
await query.table('users').whereOp('id', '=', 1).delete();

// Delete multiple records
await query.table('users').whereOp('status', '=', 'inactive').delete();
```

### Where Clauses

```typescript
// Basic where
query.whereOp('age', '>', 18);
query.whereOp('status', '=', 'active');
query.whereOp('email', 'LIKE', '%@example.com');

// Multiple where conditions (AND)
query.whereOp('age', '>', 18).whereOp('status', '=', 'active');

// Or where
query.whereOp('role', '=', 'admin').orWhereOp('role', '=', 'moderator');

// Where in
query.whereIn('status', ['active', 'pending', 'approved']);

// Where not in
query.whereNotIn('status', ['banned', 'deleted']);

// Where null
query.whereNull('deleted_at');

// Where not null
query.whereNotNull('email_verified_at');

// Where between
query.whereBetween('age', [18, 65]);
```

### Joins

```typescript
// Inner join
const results = await query
  .table('users')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .select(['users.name', 'posts.title'])
  .get();

// Left join
const users = await query
  .table('users')
  .leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
  .get();

// Right join
const data = await query
  .table('orders')
  .rightJoin('customers', 'orders.customer_id', '=', 'customers.id')
  .get();

// Multiple joins
const results = await query
  .table('users')
  .join('posts', 'users.id', '=', 'posts.user_id')
  .join('categories', 'posts.category_id', '=', 'categories.id')
  .select(['users.name', 'posts.title', 'categories.name as category'])
  .get();
```

### Ordering and Limiting

```typescript
// Order by
query.orderBy('created_at', 'desc');
query.orderBy('name', 'asc');

// Multiple order by
query.orderBy('status', 'asc').orderBy('created_at', 'desc');

// Limit
query.limit(10);

// Offset
query.offset(20);

// Pagination
query.limit(10).offset(20); // Page 3, 10 items per page
```

### Grouping and Aggregates

```typescript
// Group by
const results = await query
  .table('orders')
  .select(['status', 'COUNT(*) as count'])
  .groupBy('status')
  .get();

// Having clause
const data = await query
  .table('users')
  .select(['country', 'COUNT(*) as user_count'])
  .groupBy('country')
  .having('user_count', '>', 10)
  .get();

// Aggregate functions
const totalUsers = await query.table('users').count();
const avgAge = await query.table('users').avg('age');
const maxPrice = await query.table('products').max('price');
const minPrice = await query.table('products').min('price');
const totalRevenue = await query.table('orders').sum('total');
```

### Raw Queries

```typescript
// Execute raw SQL
const results = await conn.raw('SELECT * FROM users WHERE age > ?', [18]);

// Raw where clause
query.table('users').whereRaw('DATE(created_at) = CURDATE()');

// Raw select
query.table('users').selectRaw('COUNT(*) as total, AVG(age) as average_age');
```

## Schema Builder

### Creating Tables

```typescript
import { Schema, Blueprint } from '@devbro/neko-sql';

const schema = new Schema(conn, conn.getSchemaGrammar());

// Create a new table
await schema.createTable('users', (table: Blueprint) => {
  table.id(); // Auto-incrementing primary key
  table.string('name', 255);
  table.string('email', 255).unique();
  table.string('password');
  table.integer('age').nullable();
  table.boolean('is_active').default(true);
  table.text('bio').nullable();
  table.timestamps(); // created_at and updated_at
});

// Create table with foreign key
await schema.createTable('posts', (table: Blueprint) => {
  table.id();
  table.string('title');
  table.text('content');
  table.integer('user_id').unsigned();
  table.foreign('user_id').references('id').on('users').onDelete('cascade');
  table.timestamps();
});
```

### Modifying Tables

```typescript
// Add columns
await schema.alterTable('users', (table: Blueprint) => {
  table.string('phone', 20).nullable();
  table.timestamp('last_login').nullable();
});

// Drop columns
await schema.alterTable('users', (table: Blueprint) => {
  table.dropColumn('phone');
});

// Rename column
await schema.alterTable('users', (table: Blueprint) => {
  table.renameColumn('name', 'full_name');
});
```

### Dropping Tables

```typescript
// Drop table if exists
await schema.dropTableIfExists('users');

// Drop table
await schema.dropTable('users');
```

### Available Column Types

```typescript
table.id(); // Auto-incrementing ID
table.integer('column'); // Integer
table.bigInteger('column'); // Big integer
table.string('column', 255); // VARCHAR
table.text('column'); // TEXT
table.boolean('column'); // Boolean
table.date('column'); // Date
table.datetime('column'); // Datetime
table.timestamp('column'); // Timestamp
table.json('column'); // JSON
table.decimal('column', 10, 2); // Decimal
table.float('column'); // Float
table.double('column'); // Double

// Modifiers
column.nullable(); // Allow NULL
column.default(value); // Set default value
column.unique(); // Add unique constraint
column.unsigned(); // Unsigned (for numbers)
column.primary(); // Set as primary key
```

## Transactions

```typescript
// Using transactions
await conn.beginTransaction();

try {
  // Execute queries
  await conn.getQuery().table('users').insert({ name: 'John' });
  await conn.getQuery().table('logs').insert({ action: 'user_created' });

  // Commit if successful
  await conn.commit();
} catch (error) {
  // Rollback on error
  await conn.rollback();
  throw error;
}
```

## Database Management

### Create/Drop Database

```typescript
// Check if database exists
const exists = await conn.existsDatabase('mydb');

// Create database
await conn.createDatabase('mydb');

// Drop database
await conn.dropDatabase('mydb');
```

## Connection Pooling

For production applications, use connection pooling:

```typescript
import { PostgresqlConnection } from '@devbro/neko-sql';

const conn = new PostgresqlConnection({
  host: 'localhost',
  database: 'mydb',
  user: 'myuser',
  password: 'mypassword',
  port: 5432,
  // Connection pool settings
  max: 20, // Maximum number of connections
  min: 5, // Minimum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Best Practices

1. **Always Close Connections** - Use `await conn.disconnect()` when done
2. **Use Transactions** - For multiple related operations
3. **Parameterized Queries** - Use the query builder or raw queries with parameters
4. **Connection Pooling** - Enable pooling in production
5. **Error Handling** - Wrap database operations in try-catch blocks
6. **Environment Variables** - Store credentials in environment variables
7. **Migrations** - Use schema builder for database versioning

## Advanced Example

```typescript
import { PostgresqlConnection, Schema, Blueprint } from '@devbro/neko-sql';

async function main() {
  const conn = new PostgresqlConnection({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    await conn.connect();

    // Create schema
    const schema = new Schema(conn, conn.getSchemaGrammar());

    await schema.createTable('users', (table: Blueprint) => {
      table.id();
      table.string('email', 250).unique();
      table.string('first_name').default('');
      table.timestamps();
    });

    // Insert data
    const userId = await conn.getQuery().table('users').insertGetId({
      email: 'john@example.com',
      first_name: 'John',
    });

    // Query with joins
    const results = await conn
      .getQuery()
      .table('users')
      .leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
      .whereOp('users.id', '=', userId)
      .select(['users.*', 'profiles.bio'])
      .first();

    console.log('User:', results);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await conn.disconnect();
  }
}

main();
```

## TypeScript Support

Full TypeScript definitions included:

```typescript
import { Connection, Query, Schema, Blueprint } from '@devbro/neko-sql';

// Type-safe queries
interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

const users = await conn.getQuery().table<User>('users').get();

// users is typed as User[]
```

## Troubleshooting

### Connection Issues

```typescript
// Test connection
try {
  await conn.connect();
  console.log('Connected successfully');
} catch (error) {
  console.error('Connection failed:', error.message);
}
```

### Debugging Queries

Enable query logging to see generated SQL:

```typescript
// Log executed queries (implementation may vary)
conn.on('query', (sql) => {
  console.log('Executed:', sql);
});
```

## Migration Example

```typescript
// migrations/001_create_users_table.ts
import { Schema, Blueprint, Connection } from '@devbro/neko-sql';

export async function up(conn: Connection) {
  const schema = new Schema(conn, conn.getSchemaGrammar());

  await schema.createTable('users', (table: Blueprint) => {
    table.id();
    table.string('email').unique();
    table.string('password');
    table.timestamps();
  });
}

export async function down(conn: Connection) {
  const schema = new Schema(conn, conn.getSchemaGrammar());
  await schema.dropTable('users');
}
```

## Examples and Tests

For more comprehensive examples, check the test files in the repository:

- `/tests/query.test.ts` - Query builder examples
- `/tests/schema.test.ts` - Schema builder examples
- `/tests/transactions.test.ts` - Transaction examples

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Areas we'd love help with:

- MSSQL support
- Additional query builder features
- Performance optimizations
- Documentation improvements

## License

MIT

## Related Packages

- [@devbro/neko-orm](https://www.npmjs.com/package/@devbro/neko-orm) - Object-relational mapping
- [@devbro/neko-cache](https://www.npmjs.com/package/@devbro/neko-cache) - Caching solution
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
