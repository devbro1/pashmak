---
sidebar_position: 2
---

# Database Migrations

Database migrations provide version control for your database schema, allowing you to track and manage changes to your database structure over time. They enable teams to synchronize database changes and provide a way to roll back changes when needed.

## What are Migrations?

Migrations are classes that define changes to be made to your database schema. Each migration has:

- An `up()` method that applies the changes
- A `down()` method that reverts the changes

## Creating Migrations

### Basic Migration Structure

```typescript
import { Migration, Schema } from "@devbro/neko-sql";

export class CreateUsersTable extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.createTable("users", (table) => {
      table.id();
      table.timestamps();
      table.string("name");
      table.string("email").unique();
      table.boolean("active").default(true);
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.dropTable("users");
  }
}
```

### Migration with Foreign Keys

```typescript
export class CreatePostsTable extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.createTable("posts", (table) => {
      table.id();
      table.timestamps();
      table.string("title");
      table.text("content");
      table.integer("user_id");
      table.boolean("published").default(false);

      table.foreign("user_id").references("id").on("users").onDelete("cascade");

      table.index("user_id");
      table.index("published");
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.dropTable("posts");
  }
}
```

### Alter Table Migration

```typescript
export class AddPhoneToUsers extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.alterTable("users", (table) => {
      table.string("phone_number", 20).nullable();
      table.index("phone_number");
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.alterTable("users", (table) => {
      table.dropColumn("phone_number");
    });
  }
}
```

## Schema Builder

The Schema Builder is used within migrations to create and modify database tables.

### Getting the Schema Builder

```typescript
// Within a migration
const schema = connection.getSchema();
```

## Creating Tables

### Basic Table

```typescript
await schema.createTable("users", (table) => {
  table.id(); // Auto-increment primary key
  table.timestamps(); // created_at and updated_at
  table.string("name");
  table.string("email").unique();
  table.boolean("active").default(true);
});
```

### Column Types

```typescript
await schema.createTable("products", (table) => {
  // Auto-increment ID
  table.id();

  // String types
  table.string("name", 255); // VARCHAR(255)
  table.text("description"); // TEXT
  table.char("code"); // CHAR

  // Numeric types
  table.integer("quantity"); // INTEGER
  table.float("price"); // FLOAT
  table.double("weight"); // DOUBLE PRECISION

  // Boolean
  table.boolean("in_stock"); // BOOLEAN

  // Date/Time
  table.date("manufactured_date"); // DATE
  table.timestamp("sold_at"); // TIMESTAMP
  table.timestampTz("delivered_at"); // TIMESTAMP WITH TIME ZONE
  table.datetime("checked_at"); // Alias for timestamp
  table.datetimeTz("verified_at"); // Alias for timestampTz

  // JSON
  table.json("metadata"); // JSON
  table.jsonb("settings"); // JSONB (PostgreSQL)

  // Timestamps
  table.timestamps(); // created_at, updated_at
});
```

### Column Modifiers

```typescript
await schema.createTable("posts", (table) => {
  table.id();

  // Nullable column
  table.string("subtitle").nullable();

  // NOT NULL (default)
  table.string("title"); // NOT NULL by default

  // Default value
  table.integer("views").default(0);
  table.boolean("published").default(false);
  table.string("status").default("draft");

  // Unique constraint
  table.string("slug").unique();

  // Multiple modifiers
  table.string("email").length(200).unique().nullable(false);
});
```

### Primary Keys

```typescript
await schema.createTable("composite_keys", (table) => {
  table.integer("user_id");
  table.integer("role_id");

  // Composite primary key
  table.primary(["user_id", "role_id"]);
});
```

### Foreign Keys

```typescript
await schema.createTable("posts", (table) => {
  table.id();
  table.integer("user_id");
  table.integer("category_id");

  // Foreign key with cascade
  table
    .foreign("user_id")
    .references("id")
    .on("users")
    .onDelete("cascade")
    .onUpdate("cascade");

  // Foreign key with restrict
  table
    .foreign("category_id")
    .references("id")
    .on("categories")
    .onDelete("restrict")
    .onUpdate("restrict");
});

// onDelete/onUpdate options:
// - 'cascade': Delete/update child records
// - 'set null': Set child column to NULL
// - 'restrict': Prevent deletion/update
// - 'no action': Similar to restrict
```

### Indexes

You can add indexes to your tables for better query performance:

```typescript
await schema.createTable("articles", (table) => {
  table.id();
  table.string("title");
  table.string("slug");
  table.text("content");
  table.string("author");
  table.string("category");

  // Basic index
  table.index("title");

  // Named index
  table.index("slug", "idx_article_slug");

  // Unique index
  table.unique("slug");

  // Composite index
  table.index(["author", "category"]);

  // Index with custom type
  table.index("content").type("gin"); // For PostgreSQL full-text search

  // Multiple indexes
  table.index("author");
  table.index("category");
  table.unique(["author", "slug"]);
});

// Index types (PostgreSQL):
// - 'btree': Default, good for equality and range queries
// - 'hash': For equality comparisons
// - 'gin': For full-text search, JSONB
// - 'gist': For geometric data
// - 'spgist': Space-partitioned GiST
// - 'brin': Block Range INdexes
```

## Modifying Tables

### Add Columns

```typescript
await schema.alterTable("users", (table) => {
  table.string("phone_number").nullable();
  table.date("birth_date");
  table.text("bio");
});
```

### Drop Columns

```typescript
await schema.alterTable("users", (table) => {
  table.dropColumn("temporary_field");
  table.dropColumn("old_column");
});
```

### Add Indexes to Existing Table

```typescript
await schema.alterTable("users", (table) => {
  table.index("email");
  table.index(["first_name", "last_name"], "idx_full_name");
});
```

### Add Column with Index

```typescript
await schema.alterTable("posts", (table) => {
  table.string("slug").unique();
  table.index("slug"); // Separate index on the same column
});
```

## Dropping Tables

```typescript
// Drop table
await schema.dropTable("old_table");

// Drop table if exists
await schema.dropTableIfExists("temp_table");
```

## Table Information

```typescript
// Get all tables
const tables = await schema.tables();
console.log(tables);

// Check if table exists
const exists = await schema.tableExists("users");
console.log(exists); // true or false
```

## Migration Best Practices

### 1. Always Write Down Methods

Every migration should have a corresponding down method that can undo the changes:

```typescript
export class AddEmailVerificationToUsers extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.alterTable("users", (table) => {
      table.boolean("email_verified").default(false);
      table.timestamp("email_verified_at").nullable();
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.alterTable("users", (table) => {
      table.dropColumn("email_verified");
      table.dropColumn("email_verified_at");
    });
  }
}
```

### 2. Use Descriptive Migration Names

Migration class names should clearly describe what they do:

```typescript
// ✅ Good names
export class CreateUsersTable extends Migration {}
export class AddEmailIndexToUsers extends Migration {}
export class RemoveDeprecatedColumns extends Migration {}

// ❌ Avoid vague names
export class Migration1 extends Migration {}
export class UpdateTable extends Migration {}
```

### 3. Handle Foreign Key Dependencies

When creating tables with foreign keys, ensure the referenced tables exist:

```typescript
// Create users table first
export class CreateUsersTable extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.createTable("users", (table) => {
      table.id();
      table.string("email").unique();
      table.timestamps();
    });
  }
}

// Then create posts table that references users
export class CreatePostsTable extends Migration {
  async up(schema: Schema): Promise<void> {
    await schema.createTable("posts", (table) => {
      table.id();
      table.string("title");
      table.integer("user_id");
      table.timestamps();

      table.foreign("user_id").references("id").on("users").onDelete("cascade");
    });
  }
}
```

### 4. Use Transactions for Multiple Operations

```typescript
export class ComplexDataMigration extends Migration {
  async up(schema: Schema): Promise<void> {
    // Multiple related schema changes should be wrapped in a transaction
    await schema.createTable("categories", (table) => {
      table.id();
      table.string("name");
    });

    await schema.alterTable("posts", (table) => {
      table.integer("category_id").nullable();
      table.foreign("category_id").references("id").on("categories");
    });
  }

  async down(schema: Schema): Promise<void> {
    await schema.alterTable("posts", (table) => {
      table.dropColumn("category_id");
    });

    await schema.dropTable("categories");
  }
}
```

### 5. Test Your Migrations

Always test both up and down methods:

```typescript
// Test migration up
await migration.up(schema);

// Verify changes were applied
const tableExists = await schema.tableExists("new_table");
console.log("Table created:", tableExists);

// Test migration down
await migration.down(schema);

// Verify changes were reverted
const tableExistsAfterDown = await schema.tableExists("new_table");
console.log("Table removed:", !tableExistsAfterDown);
```
