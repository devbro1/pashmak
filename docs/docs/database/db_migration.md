---
sidebar_position: 2
---

# Migration

TODO: ????

```ts
  async up(schema: Schema) {
    await schema.createTable("orders", (blueprint: Blueprint) => {
      blueprint.id();
      blueprint.timestamps();
      blueprint.integer("customer_id");
      blueprint.foreign("customer_id")
        .references("id")
        .on("users")
        .onDelete("cascade")
        .onUpdate("cascade");
    });
  }
```

## Creating new table

### Columns

### Foreign Key

### Indexes

You can add indexes to your tables for better query performance:

#### Basic Index
```ts
await schema.createTable("users", (table: Blueprint) => {
  table.id();
  table.string("email");
  table.string("username");
  
  // Create basic index
  table.index("email");
  
  // Create named index
  table.index("username", "idx_username");
});
```

#### Unique Indexes
```ts
await schema.createTable("users", (table: Blueprint) => {
  table.id();
  table.string("email");
  
  // Create unique index
  table.unique("email");
  
  // Create named unique index
  table.unique("email", "unique_user_email");
});
```

#### Composite Indexes
```ts
await schema.createTable("users", (table: Blueprint) => {
  table.id();
  table.string("first_name");
  table.string("last_name");
  
  // Create composite index on multiple columns
  table.index(["first_name", "last_name"]);
  
  // Create named composite index
  table.index(["first_name", "last_name"], "idx_full_name");
});
```

#### Custom Index Types
```ts
await schema.createTable("posts", (table: Blueprint) => {
  table.id();
  table.text("content");
  
  // Create index with specific type (useful for PostgreSQL)
  table.index("content").indexType("gin");
});
```

### Adding Indexes in Migrations

You can also add indexes when altering existing tables:

```ts
await schema.alterTable("users", (table: Blueprint) => {
  // Add new column with index
  table.string("phone");
  table.index("phone");
  
  // Add unique constraint to existing column
  table.unique("email", "unique_email_constraint");
});
```
