---
sidebar_position: 3
---

# DB and SQL

The `@devbro/neko-sql` package provides a powerful SQL query builder for working with relational databases. It supports PostgreSQL with plans for MySQL, SQLite, and MS SQL Server.

## Features

- **Query Builder**: Flexible API for building SQL queries

- **Transactions**: ACID-compliant transaction support
- **Joins**: All types of SQL joins
- **Raw Queries**: Execute raw SQL when needed

## Quick Reference - Query Builder API

Here's a comprehensive example showing all possible query builder methods and their variations:

```typescript
import { db } from "@devbro/pashmak/facades";

const connection = new PostgresqlConnection({
  /* config */
});
await connection.connect();

const query = connection.getQuery();
// OR
const query = await db().getQuery();

// 🔷 TABLE SELECTION
query.table("users"); // Set the table to query

// 🔷 SELECT COLUMNS
query.select(["id", "name", "email"]); // Specific columns
query.select(["*"]); // All columns (default)
query.select(["users.*", "posts.title"]); // With table prefix

// 🔷 WHERE CLAUSES
query.whereOp("age", "=", 25); // Equality
query.whereOp("age", ">", 18); // Greater than
query.whereOp("age", "<", 65); // Less than
query.whereOp("age", "!=", 30); // Not equal
query.whereOp("name", "like", "John%"); // LIKE pattern
query.whereOp("name", "ilike", "john%"); // Case-insensitive LIKE
query.whereOp("id", "in", [1, 2, 3]); // IN clause
query.whereOp("status", "=", "active", "or"); // OR condition
query.whereOp("deleted", "=", true, "and", true); // NOT condition `not deleted = true`

// WHERE NULL
query.whereNull("deleted_at"); // IS NULL
query.whereNull("deleted_at", "and", true); // not deleted_at is null

// WHERE COLUMN COMPARISON
query.whereColumn("first_name", "=", "last_name"); // Compare columns

// NESTED WHERE
query.whereNested((q) => {
  q.whereOp("status", "=", "active").whereOp("status", "=", "pending", "or");
});

// RAW WHERE
query.whereRaw("LOWER(email) = ?", ["john@example.com"]);
query.whereRaw("DATE(created_at) = CURRENT_DATE", []);

// CLEAR WHERE
query.clearWhere(); // Remove all where clauses

// 🔷 JOINS
query.innerJoin("posts", [{ column1: "users.id", column2: "posts.user_id" }]);

query.leftJoin("profiles as p", [
  { column1: "users.id", column2: "p.user_id" },
]);

query.rightJoin("orders", [
  { column1: "users.id", column2: "orders.customer_id" },
]);

query.fullJoin("departments", [
  { column1: "employees.dept_id", column2: "departments.id" },
]);

query.crossJoin("sizes", []);

// JOIN WITH SUBQUERY
const subquery = connection
  .getQuery()
  .table("posts")
  .groupBy(["user_id"])
  .alias("post_counts"); // adding alias for subquery is mandatory to generate valid sql
query.innerJoin(subquery, [
  { column1: "users.id", column2: "post_counts.user_id" },
]);

// 🔷 ORDERING
query.orderBy("created_at", "desc"); // Descending
query.orderBy("name", "asc"); // Ascending
query.orderBy("age").orderBy("name"); // Multiple orders

// 🔷 GROUPING
query.groupBy(["status"]); // Single column
query.groupBy(["country", "city"]); // Multiple columns

// 🔷 HAVING CLAUSES
query.havingOp("count", ">", 10);
query.havingOp("sum", ">=", 1000, "or");
query.havingRaw("COUNT(*) > ?", [5]);

// 🔷 LIMITING & OFFSETTING
query.limit(10); // LIMIT 10
query.offset(20); // OFFSET 20
query.limit(10).offset(20); // Pagination

// 🔷 ALIAS
query.alias("u"); // Table alias

// 🔷 QUERY COMPILATION
const compiled = query.toSql();
// Returns: { sql: string, bindings: any[], parts: string[] }

// 🔷 EXECUTION METHODS
const results = await query.get(); // Get all results
const first = await query.first(); // Get first result or undefined
const count = await query.count(); // Get count
const cursor = await query.getCursor(); // Get cursor for streaming

// 🔷 DATA MANIPULATION

// INSERT
await query.table("users").insert({
  name: "John",
  email: "john@example.com",
  age: 30,
  created_at: new Date(),
});

// INSERT AND GET ID
const result = await query.table("users").insertGetId(
  {
    name: "Jane",
    email: "jane@example.com",
  },
  { primaryKey: ["id"] },
);
console.log(result[0].id);

// UPDATE
await query.table("users").whereOp("id", "=", 1).update({
  name: "John Smith",
  updated_at: new Date(),
});

// UPSERT (INSERT OR UPDATE)
await query.table("users").upsert(
  {
    email: "john@example.com", // Data to insert/update
    name: "John Doe",
    age: 30,
  },
  ["email"], // Unique constraint columns
  ["name", "age"], // Columns to update on conflict
);

// DELETE
await query.table("users").whereOp("status", "=", "deleted").delete();

// 🔷 CHAINING EXAMPLE - Complex Query
const complexResults = await query
  .table("orders")
  .select(["orders.id", "users.name", "SUM(order_items.price) as total"])
  .innerJoin("users", [{ column1: "orders.user_id", column2: "users.id" }])
  .innerJoin("order_items", [
    { column1: "orders.id", column2: "order_items.order_id" },
  ])
  .whereOp("orders.status", "=", "completed")
  .whereNested((q) => {
    q.whereOp("orders.total", ">", 100).whereOp(
      "orders.priority",
      "=",
      "high",
      "or",
    );
  })
  .groupBy(["orders.id", "users.name"])
  .havingOp("total", ">", 50)
  .orderBy("total", "desc")
  .limit(20)
  .offset(0)
  .get();
```

### Method Summary Table

| Category         | Methods                                                                                    | Parameters                                      |
| ---------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| **Selection**    | `table()`, `select()`, `alias()`                                                           | table name, column array, alias string          |
| **Where**        | `whereOp()`, `whereNull()`, `whereColumn()`, `whereNested()`, `whereRaw()`, `clearWhere()` | column, operator, value, join condition, negate |
| **Joins**        | `innerJoin()`, `leftJoin()`, `rightJoin()`, `fullJoin()`, `crossJoin()`                    | table/subquery, conditions array                |
| **Ordering**     | `orderBy()`                                                                                | column, direction ('asc'/'desc')                |
| **Grouping**     | `groupBy()`, `havingOp()`, `havingRaw()`                                                   | columns array, conditions                       |
| **Limiting**     | `limit()`, `offset()`                                                                      | number                                          |
| **Execution**    | `get()`, `first()`, `count()`, `getCursor()`                                               | none                                            |
| **Manipulation** | `insert()`, `insertGetId()`, `update()`, `upsert()`, `delete()`                            | data object, options                            |
| **Utility**      | `toSql()`, `getConnection()`                                                               | none                                            |

### Operators Available in `whereOp()` and `havingOp()`

- `=` - Equal
- `>` - Greater than
- `<` - Less than
- `!=` - Not equal
- `like` - SQL LIKE (case-sensitive)
- `ilike` - SQL ILIKE (case-insensitive, PostgreSQL)
- `in` - IN clause (value must be array)

## Connection

### Creating a Connection

Currently each request will open its own connection to database, you can then use db facade to gain access to this connection:

```typescript
import { db } from "@devbro/pashmak/facades";

const connection = db();
const q = connection.getQuery();
```

### Connection Methods

```typescript
// Begin transaction
await connection.beginTransaction();

// Commit transaction
await connection.commit();

// Rollback transaction
await connection.rollback();

// Disconnect
await connection.disconnect();

// Get query builder
const query = connection.getQuery();
```

## Query Builder

### Basic Queries

#### Select All Records

```typescript
const query = connection.getQuery();
const results = await query.table("users").get();
```

#### Select Specific Columns

```typescript
const results = await query
  .table("users")
  .select(["id", "name", "email"])
  .get();
```

#### Get First Record

```typescript
const user = await query.table("users").whereOp("id", "=", 1).first();
```

#### Count Records

```typescript
const count = await query.table("users").whereOp("active", "=", true).count();
```

### Where Clauses

#### Basic Where

```typescript
// WHERE column = value
query.whereOp("name", "=", "John");

// WHERE column > value
query.whereOp("age", ">", 18);

// WHERE column LIKE value
query.whereOp("email", "like", "%@example.com");

// WHERE column ILIKE value (case-insensitive)
query.whereOp("name", "ilike", "john%");

// WHERE column IN (values)
query.whereOp("status", "in", ["active", "pending"]);
```

#### OR Conditions

```typescript
// WHERE name = 'John' OR name = 'Jane'
query.whereOp("name", "=", "John").whereOp("name", "=", "Jane", "or");
```

If you have multiple operations, the merge type of first one is always ignored.

```typescript
// WHERE name = 'John' OR name = 'Jane'
query
  .whereOp("name", "=", "John", "XYZ")
  .whereOp("name", "=", "Jane", "or")
  .whereOp("name", "=", "Jack", "or"); // where name = 'John' or name = 'Jane' or name = 'Jack'
```

#### NOT Conditions

```typescript
// WHERE NOT status = 'deleted'
query.whereOp("status", "=", "deleted", "and", true); // and not status = `deleted`
```

#### Where NULL

```typescript
// WHERE email IS NULL
query.whereNull("email");

// WHERE email IS NOT NULL
query.whereNull("email", "and", true);
```

#### Where Column Comparison

```typescript
// WHERE first_name = last_name
query.whereColumn("first_name", "=", "last_name");
```

#### Nested Where Clauses

```typescript
// WHERE (status = 'active' OR status = 'pending') AND age > 18
query
  .whereNested((q) => {
    q.whereOp("status", "=", "active").whereOp("status", "=", "pending", "or");
  })
  .whereOp("age", ">", 18);
```

#### Raw Where Clauses

```typescript
// Custom SQL in where clause
query.whereRaw("LOWER(email) = ?", ["john@example.com"]);
```

#### Clear Where Clauses

```typescript
// Remove all where conditions
query.clearWhere();
```

### Ordering

```typescript
// ORDER BY name ASC
query.orderBy("name", "asc");

// ORDER BY created_at DESC
query.orderBy("created_at", "desc");

// Multiple order by
query.orderBy("status", "asc").orderBy("created_at", "desc");
```

### Limiting and Offsetting

```typescript
// LIMIT 10
query.limit(10);

// OFFSET 20
query.offset(20);

// Pagination: LIMIT 10 OFFSET 20
query.limit(10).offset(20);
```

### Grouping

```typescript
// GROUP BY status
query.groupBy(["status"]);

// GROUP BY country, city
query.groupBy(["country", "city"]);
```

### Having Clauses

```typescript
// HAVING count > 5
query.groupBy(["status"]).havingOp("count", ">", 5);

// HAVING with raw SQL
query.groupBy(["status"]).havingRaw("COUNT(*) > ?", [10]);
```

### Joins

#### Inner Join

```typescript
// INNER JOIN
query
  .table("users")
  .innerJoin("posts", [{ column1: "users.id", column2: "posts.user_id" }]);
```

#### Left Join

```typescript
query
  .table("users")
  .leftJoin("posts", [{ column1: "users.id", column2: "posts.user_id" }]);
```

#### Right Join

```typescript
query
  .table("orders")
  .rightJoin("customers", [
    { column1: "orders.customer_id", column2: "customers.id" },
  ]);
```

#### Full Join

```typescript
query
  .table("employees")
  .fullJoin("departments", [
    { column1: "employees.dept_id", column2: "departments.id" },
  ]);
```

#### Cross Join

```typescript
query.table("colors").crossJoin("sizes", []);
```

#### Join with Subquery

```typescript
const subquery = connection
  .getQuery()
  .table("posts")
  .select(["user_id", "COUNT(*) as post_count"])
  .groupBy(["user_id"])
  .alias("post_stats");

query
  .table("users")
  .innerJoin(subquery, [
    { column1: "users.id", column2: "post_stats.user_id" },
  ]);
```

### Data Manipulation

#### Insert

```typescript
await query.table("users").insert({
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  created_at: new Date(),
});
```

#### Insert and Get ID

```typescript
const result = await query.table("users").insertGetId(
  {
    name: "Jane Doe",
    email: "jane@example.com",
  },
  { primaryKey: ["id"] },
);

console.log(result[0].id); // Returns the inserted ID
```

#### Update

```typescript
// Update all records
await query.table("users").update({
  updated_at: new Date(),
});

// Update with where clause
await query.table("users").whereOp("id", "=", 1).update({
  name: "John Smith",
  updated_at: new Date(),
});
```

#### Upsert (Insert or Update)

```typescript
// Insert new or update existing based on unique columns
await query.table("users").upsert(
  {
    email: "john@example.com",
    name: "John Doe",
    age: 30,
  },
  ["email"], // Unique columns to check
  ["name", "age"], // Columns to update if exists
);
```

#### Delete

```typescript
// Delete with where clause
await query.table("users").whereOp("status", "=", "deleted").delete();

// Delete all (be careful!)
await query.table("temp_data").delete();
```

### Query Compilation

```typescript
// Get compiled SQL without executing
const compiled = query.table("users").whereOp("age", ">", 18).toSql();
console.log(compiled.sql); // "select * from users where age > ?"
console.log(compiled.bindings); // [18]
```

## Transactions

Transactions ensure data integrity by grouping multiple operations.

### Basic Transaction

```typescript
const connection = new PostgresqlConnection(config);
await connection.connect();

try {
  await connection.beginTransaction();

  const query = connection.getQuery();

  // Insert user
  const result = await query.table("users").insertGetId({
    name: "John Doe",
    email: "john@example.com",
  });

  const userId = result[0].id;

  // Insert related data
  await query.table("profiles").insert({
    user_id: userId,
    bio: "Software developer",
  });

  await connection.commit();
  console.log("Transaction successful");
} catch (error) {
  await connection.rollback();
  console.error("Transaction failed:", error);
}
```

### Transaction with Multiple Operations

```typescript
await connection.beginTransaction();

try {
  // Update account balance
  await query
    .table("accounts")
    .whereOp("id", "=", fromAccountId)
    .update({ balance: balanceAfterDebit });

  // Update another account
  await query
    .table("accounts")
    .whereOp("id", "=", toAccountId)
    .update({ balance: balanceAfterCredit });

  // Record transaction
  await query.table("transactions").insert({
    from_account: fromAccountId,
    to_account: toAccountId,
    amount: transferAmount,
    created_at: new Date(),
  });

  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

## Advanced Query Examples

### Complex Where with Nested Conditions

```typescript
// SELECT * FROM orders
// WHERE (status = 'pending' OR status = 'processing')
// AND total > 100
// AND created_at > '2024-01-01'
const results = await query
  .table("orders")
  .whereNested((q) => {
    q.whereOp("status", "=", "pending").whereOp(
      "status",
      "=",
      "processing",
      "or",
    );
  })
  .whereOp("total", ">", 100)
  .whereOp("created_at", ">", "2024-01-01")
  .get();
```

### Query with Multiple Joins

```typescript
const results = await query
  .table("orders")
  .select(["orders.*", "users.name", "products.title"])
  .innerJoin("users", [{ column1: "orders.user_id", column2: "users.id" }])
  .innerJoin("order_items", [
    { column1: "orders.id", column2: "order_items.order_id" },
  ])
  .innerJoin("products", [
    { column1: "order_items.product_id", column2: "products.id" },
  ])
  .whereOp("orders.status", "=", "completed")
  .orderBy("orders.created_at", "desc")
  .get();
```

### Aggregation with Group By

```typescript
const stats = await query
  .table("orders")
  .select(["user_id", "COUNT(*) as order_count", "SUM(total) as total_spent"])
  .groupBy(["user_id"])
  .havingOp("order_count", ">", 5)
  .orderBy("total_spent", "desc")
  .get();
```

## Best Practices

### 1. Use Transactions for Related Operations

Always wrap related database operations in transactions to maintain data consistency.

### 2. Use Prepared Statements

The query builder automatically uses parameterized queries to prevent SQL injection:

```typescript
// ✅ Safe - uses parameters
query.whereOp("email", "=", userInput);

// ❌ Avoid raw SQL with user input
query.whereRaw(`email = '${userInput}'`); // Dangerous!, you are open to sql injection

// ✅ If you must use raw SQL, use bindings
query.whereRaw("email = ?", [userInput]);
```

### 3. Index Frequently Queried Columns

Add indexes to columns used in WHERE, JOIN, and ORDER BY clauses:

```typescript
table.index("email");
table.index("created_at");
table.index(["user_id", "status"]); // Composite index
```

### 4. Use Appropriate Column Types

Choose the right column type for your data to optimize storage and performance:

```typescript
table.boolean("active"); // Not integer for boolean values
table.date("birth_date"); // Not string for dates
table.jsonb("metadata"); // For structured data in PostgreSQL
```

### 5. Clean Up Connections

Always disconnect when done:

```typescript
try {
  const results = await query.table("users").get();
  // Process results
} finally {
  await connection.disconnect();
}
```

## Troubleshooting

### Connection Issues

```typescript
// Verify connection configuration
const connection = new PostgresqlConnection({
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Test connection
try {
  await connection.connect();
  console.log("Connected successfully");
} catch (error) {
  console.error("Connection failed:", error);
}
```

### Debug SQL Queries

```typescript
// View compiled SQL before executing
const compiled = query.table("users").whereOp("active", "=", true).toSql();
console.log("SQL:", compiled.sql);
console.log("Bindings:", compiled.bindings);
```

## Supported Databases

### Current Support

- **PostgreSQL**: Full support

### Planned Support

- MySQL
- SQLite
- Microsoft SQL Server
