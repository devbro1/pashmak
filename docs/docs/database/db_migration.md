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
