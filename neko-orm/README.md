# @devbro/neko-orm

A modern, type-safe ORM for Node.js and TypeScript. Build database models with decorators, relationships, and an intuitive API. Built on top of [@devbro/neko-sql](https://www.npmjs.com/package/@devbro/neko-sql).

## Installation

```bash
npm install @devbro/neko-orm @devbro/neko-sql
```

## Features

- 🎯 **Decorator-Based Models** - Define models using TypeScript decorators
- 🔗 **Relationships** - One-to-One, One-to-Many, Many-to-One, Many-to-Many
- 🔄 **Polymorphic Relations** - Flexible, reusable relationships
- 🛡️ **Type-Safe** - Full TypeScript support with type inference
- 📝 **Auto Timestamps** - Automatic created_at and updated_at handling
- 🔒 **Transactions** - Deep integration with neko-sql transactions
- 🎨 **Query Builder** - Fluent API for complex queries
- ⚡ **Lazy & Eager Loading** - Optimize database queries
- 🔍 **Scopes** - Reusable query constraints
- 🗃️ **Soft Deletes** - Mark records as deleted without removal

## Quick Start

### Define a Model

```ts
import { BaseModel, Attribute } from '@devbro/neko-orm';

export class User extends BaseModel {
  protected tableName = 'users';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare email: string;

  @Attribute()
  declare created_at?: Date;

  @Attribute()
  declare updated_at?: Date;
}
```

### Basic CRUD Operations

```ts
// Create
const user = new User();
user.name = 'John Doe';
user.email = 'john@example.com';
await user.save();

// Read
const foundUser = await User.find(1);
console.log(foundUser.name); // 'John Doe'

// Update
foundUser.name = 'Jane Doe';
await foundUser.save();

// Delete
await foundUser.delete();

// Query multiple records
const users = await User.query()
  .whereOp('email', 'LIKE', '%@example.com')
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

## Core Concepts

### Model Definition

```ts
import { BaseModel, Attribute } from '@devbro/neko-orm';

export class Post extends BaseModel {
  // Table name (required)
  protected tableName = 'posts';

  // Enable automatic timestamps (optional)
  protected hasTimestamps = true;

  // Primary key
  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  // Regular attributes
  @Attribute()
  declare title: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare user_id: number;

  @Attribute()
  declare published: boolean;

  // Timestamps (auto-managed if hasTimestamps = true)
  @Attribute()
  declare created_at?: Date;

  @Attribute()
  declare updated_at?: Date;
}
```

### Attribute Options

```ts
export class Product extends BaseModel {
  protected tableName = 'products';

  // Primary key
  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  // Required field
  @Attribute({ required: true })
  declare name: string;

  // With default value
  @Attribute({ default: 0 })
  declare price: number;

  // Nullable field
  @Attribute({ nullable: true })
  declare description?: string;

  // Custom column name
  @Attribute({ columnName: 'is_active' })
  declare active: boolean;
}
```

## CRUD Operations

### Creating Records

```ts
// Method 1: Instantiate and save
const user = new User();
user.name = 'Alice';
user.email = 'alice@example.com';
await user.save();

// Method 2: Create with data
const user = await User.create({
  name: 'Bob',
  email: 'bob@example.com',
});

// Method 3: Bulk create
const users = await User.createMany([
  { name: 'Charlie', email: 'charlie@example.com' },
  { name: 'David', email: 'david@example.com' },
]);
```

### Reading Records

```ts
// Find by ID
const user = await User.find(1);

// Find by ID or throw error
const user = await User.findOrFail(1);

// Find first matching record
const user = await User.query().whereOp('email', '=', 'john@example.com').first();

// Get all records
const allUsers = await User.all();

// Get with conditions
const activeUsers = await User.query().whereOp('active', '=', true).get();

// Count records
const count = await User.query().whereOp('active', '=', true).count();
```

### Updating Records

```ts
// Update single record
const user = await User.find(1);
user.name = 'Updated Name';
await user.save();

// Update with data object
await user.update({
  name: 'New Name',
  email: 'newemail@example.com',
});

// Bulk update
await User.query().whereOp('active', '=', false).update({ status: 'inactive' });
```

### Deleting Records

```ts
// Delete single record
const user = await User.find(1);
await user.delete();

// Delete by ID
await User.destroy(1);

// Bulk delete
await User.query().whereOp('created_at', '<', oneYearAgo).delete();
```

## Relationships

### One-to-Many (Has Many)

```ts
import { BaseModel, Attribute, RelationshipFactory } from '@devbro/neko-orm';

export class Country extends BaseModel {
  protected tableName = 'countries';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  // Define relationship
  states() {
    return RelationshipFactory.createHasMany<Country, State>({
      source: this,
      targetModel: State,
      foreignKey: 'country_id', // Optional, defaults to 'country_id'
    });
  }
}

export class State extends BaseModel {
  protected tableName = 'states';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare country_id: number;
}

// Usage
const canada = await Country.find(1);
const provinces = await canada.states().get();

// With query constraints
const activeProvinces = await canada.states().whereOp('active', '=', true).orderBy('name').get();
```

### Many-to-One (Belongs To)

```ts
export class State extends BaseModel {
  protected tableName = 'states';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare country_id: number;

  country() {
    return RelationshipFactory.createBelongsTo<State, Country>({
      source: this,
      targetModel: Country,
      foreignKey: 'country_id',
    });
  }
}

// Usage
const state = await State.find(1);
const country = await state.country().first();
```

### One-to-One (Has One)

```ts
export class User extends BaseModel {
  protected tableName = 'users';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  profile() {
    return RelationshipFactory.createHasOne<User, Profile>({
      source: this,
      targetModel: Profile,
      foreignKey: 'user_id',
    });
  }
}

export class Profile extends BaseModel {
  protected tableName = 'profiles';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare user_id: number;

  @Attribute()
  declare bio: string;

  user() {
    return RelationshipFactory.createBelongsTo<Profile, User>({
      source: this,
      targetModel: User,
    });
  }
}

// Usage
const user = await User.find(1);
const profile = await user.profile().first();
```

### Many-to-Many

```ts
export class User extends BaseModel {
  protected tableName = 'users';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  roles() {
    return RelationshipFactory.createBelongsToMany<User, Role>({
      source: this,
      targetModel: Role,
      pivotTable: 'user_roles',
      foreignKey: 'user_id',
      relatedKey: 'role_id',
    });
  }
}

export class Role extends BaseModel {
  protected tableName = 'roles';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  users() {
    return RelationshipFactory.createBelongsToMany<Role, User>({
      source: this,
      targetModel: User,
      pivotTable: 'user_roles',
      foreignKey: 'role_id',
      relatedKey: 'user_id',
    });
  }
}

// Usage
const user = await User.find(1);
const roles = await user.roles().get();

// Attach role to user
await user.roles().attach(roleId);

// Detach role from user
await user.roles().detach(roleId);

// Sync roles (replace all)
await user.roles().sync([1, 2, 3]);
```

### Polymorphic Relationships

```ts
export class Comment extends BaseModel {
  protected tableName = 'comments';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare content: string;

  @Attribute()
  declare commentable_id: number;

  @Attribute()
  declare commentable_type: string;

  // Polymorphic relationship
  commentable() {
    return RelationshipFactory.createMorphTo<Comment>({
      source: this,
      morphTypeColumn: 'commentable_type',
      morphIdColumn: 'commentable_id',
    });
  }
}

export class Post extends BaseModel {
  protected tableName = 'posts';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare title: string;

  comments() {
    return RelationshipFactory.createMorphMany<Post, Comment>({
      source: this,
      targetModel: Comment,
      morphName: 'commentable',
    });
  }
}

export class Video extends BaseModel {
  protected tableName = 'videos';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare title: string;

  comments() {
    return RelationshipFactory.createMorphMany<Video, Comment>({
      source: this,
      targetModel: Comment,
      morphName: 'commentable',
    });
  }
}

// Usage
const post = await Post.find(1);
const comments = await post.comments().get();

const video = await Video.find(1);
const videoComments = await video.comments().get();
```

## Query Builder Integration

Access the underlying query builder for complex queries:

```ts
// Complex query with joins
const users = await User.query()
  .join('profiles', 'users.id', '=', 'profiles.user_id')
  .whereOp('users.active', '=', true)
  .whereOp('profiles.verified', '=', true)
  .select(['users.*', 'profiles.bio'])
  .orderBy('users.created_at', 'desc')
  .limit(20)
  .get();

// Aggregates
const totalUsers = await User.query().count();
const avgAge = await User.query().avg('age');
const maxPrice = await Product.query().max('price');

// Group by
const usersByCountry = await User.query()
  .select(['country', 'COUNT(*) as total'])
  .groupBy('country')
  .get();

// Raw expressions
const users = await User.query().whereRaw('DATE(created_at) = CURDATE()').get();
```

## Transactions

Deep integration with neko-sql for transactional operations:

```ts
import { getConnection } from '@devbro/neko-sql';

const conn = getConnection();

await conn.beginTransaction();

try {
  // Create user
  const user = new User();
  user.name = 'John Doe';
  user.email = 'john@example.com';
  await user.save();

  // Create profile
  const profile = new Profile();
  profile.user_id = user.id;
  profile.bio = 'Software Developer';
  await profile.save();

  // Commit transaction
  await conn.commit();
} catch (error) {
  // Rollback on error
  await conn.rollback();
  throw error;
}
```

## Scopes

Define reusable query constraints:

```ts
export class Post extends BaseModel {
  protected tableName = 'posts';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare title: string;

  @Attribute()
  declare published: boolean;

  @Attribute()
  declare created_at: Date;

  // Define scope
  static scopePublished(query) {
    return query.whereOp('published', '=', true);
  }

  static scopeRecent(query, days = 7) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return query.whereOp('created_at', '>', date);
  }
}

// Usage
const recentPosts = await Post.query().scopePublished().scopeRecent(30).get();
```

## Soft Deletes

Mark records as deleted without removing them:

```ts
import { BaseModel, Attribute, SoftDeletes } from '@devbro/neko-orm';

export class Post extends BaseModel {
  protected tableName = 'posts';
  protected hasTimestamps = true;
  protected softDeletes = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare title: string;

  @Attribute()
  declare deleted_at?: Date;
}

// Soft delete (sets deleted_at)
const post = await Post.find(1);
await post.delete();

// Query only non-deleted records (default)
const posts = await Post.all();

// Include soft-deleted records
const allPosts = await Post.query().withTrashed().get();

// Get only soft-deleted records
const trashedPosts = await Post.query().onlyTrashed().get();

// Permanently delete
await post.forceDelete();

// Restore soft-deleted record
await post.restore();
```

## Eager Loading

Optimize queries by loading relationships upfront:

```ts
// Lazy loading (N+1 problem)
const countries = await Country.all();
for (const country of countries) {
  const states = await country.states().get(); // N queries!
}

// Eager loading (2 queries total)
const countries = await Country.query().with('states').get();

countries.forEach((country) => {
  console.log(country.states); // Already loaded!
});

// Eager load multiple relationships
const users = await User.query().with(['profile', 'posts', 'roles']).get();

// Nested eager loading
const countries = await Country.query()
  .with({
    states: (query) => {
      query.with('cities');
    },
  })
  .get();
```

## Events and Hooks

Execute code at specific points in the model lifecycle:

```ts
export class User extends BaseModel {
  protected tableName = 'users';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare email: string;

  @Attribute()
  declare password: string;

  // Before creating
  async beforeCreate() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // After creating
  async afterCreate() {
    await this.sendWelcomeEmail();
  }

  // Before updating
  async beforeUpdate() {
    if (this.isDirty('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  // Before deleting
  async beforeDelete() {
    await this.deleteRelatedData();
  }

  private async sendWelcomeEmail() {
    // Send email logic
  }

  private isDirty(field: string): boolean {
    // Check if field was modified
    return this.original[field] !== this[field];
  }
}
```

## Real-World Examples

### Blog System

```ts
import { BaseModel, Attribute, RelationshipFactory } from '@devbro/neko-orm';

export class User extends BaseModel {
  protected tableName = 'users';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare email: string;

  posts() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
    });
  }

  comments() {
    return RelationshipFactory.createHasMany<User, Comment>({
      source: this,
      targetModel: Comment,
    });
  }
}

export class Post extends BaseModel {
  protected tableName = 'posts';
  protected hasTimestamps = true;
  protected softDeletes = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare user_id: number;

  @Attribute()
  declare title: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare published: boolean;

  author() {
    return RelationshipFactory.createBelongsTo<Post, User>({
      source: this,
      targetModel: User,
      foreignKey: 'user_id',
    });
  }

  comments() {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
    });
  }

  tags() {
    return RelationshipFactory.createBelongsToMany<Post, Tag>({
      source: this,
      targetModel: Tag,
      pivotTable: 'post_tags',
    });
  }

  static scopePublished(query) {
    return query.whereOp('published', '=', true);
  }
}

export class Comment extends BaseModel {
  protected tableName = 'comments';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare post_id: number;

  @Attribute()
  declare user_id: number;

  @Attribute()
  declare content: string;

  post() {
    return RelationshipFactory.createBelongsTo<Comment, Post>({
      source: this,
      targetModel: Post,
    });
  }

  author() {
    return RelationshipFactory.createBelongsTo<Comment, User>({
      source: this,
      targetModel: User,
      foreignKey: 'user_id',
    });
  }
}

export class Tag extends BaseModel {
  protected tableName = 'tags';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  posts() {
    return RelationshipFactory.createBelongsToMany<Tag, Post>({
      source: this,
      targetModel: Post,
      pivotTable: 'post_tags',
    });
  }
}

// Usage
const posts = await Post.query()
  .scopePublished()
  .with(['author', 'comments.author', 'tags'])
  .orderBy('created_at', 'desc')
  .limit(10)
  .get();
```

### E-Commerce System

```ts
export class Product extends BaseModel {
  protected tableName = 'products';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare price: number;

  @Attribute()
  declare stock: number;

  categories() {
    return RelationshipFactory.createBelongsToMany<Product, Category>({
      source: this,
      targetModel: Category,
      pivotTable: 'product_categories',
    });
  }

  reviews() {
    return RelationshipFactory.createHasMany<Product, Review>({
      source: this,
      targetModel: Review,
    });
  }

  static scopeInStock(query) {
    return query.whereOp('stock', '>', 0);
  }

  static scopeByPriceRange(query, min: number, max: number) {
    return query.whereOp('price', '>=', min).whereOp('price', '<=', max);
  }
}

export class Order extends BaseModel {
  protected tableName = 'orders';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare user_id: number;

  @Attribute()
  declare total: number;

  @Attribute()
  declare status: string;

  user() {
    return RelationshipFactory.createBelongsTo<Order, User>({
      source: this,
      targetModel: User,
    });
  }

  items() {
    return RelationshipFactory.createHasMany<Order, OrderItem>({
      source: this,
      targetModel: OrderItem,
    });
  }
}
```

## Best Practices

1. **Use Decorators** - Define all attributes with `@Attribute` decorator
2. **Enable Timestamps** - Use automatic timestamp management
3. **Type Declarations** - Use `declare` for type-safe attributes
4. **Relationships** - Define relationships in model methods
5. **Eager Loading** - Use `.with()` to avoid N+1 queries
6. **Scopes** - Extract common queries into reusable scopes
7. **Transactions** - Use transactions for related operations
8. **Validation** - Implement validation in hooks
9. **Soft Deletes** - Use soft deletes for important data
10. **Indexes** - Add database indexes for foreign keys and frequently queried fields

## TypeScript Support

Full TypeScript support with type inference:

```ts
import { BaseModel, Attribute } from '@devbro/neko-orm';

interface UserAttributes {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export class User extends BaseModel implements UserAttributes {
  protected tableName = 'users';
  protected hasTimestamps = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;

  @Attribute()
  declare email: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;
}

// Type-safe usage
const user: User = await User.find(1);
console.log(user.name); // TypeScript knows this is a string
```

## Documentation

For comprehensive documentation and guides, visit:
**[https://devbro1.github.io/pashmak/docs/database](https://devbro1.github.io/pashmak/docs/database)**

## API Reference

### `BaseModel`

#### Static Methods

- `find(id)` - Find record by primary key
- `findOrFail(id)` - Find or throw error
- `all()` - Get all records
- `create(data)` - Create new record
- `createMany(data[])` - Create multiple records
- `query()` - Get query builder instance
- `destroy(id)` - Delete by ID

#### Instance Methods

- `save()` - Save model (insert or update)
- `update(data)` - Update model with data
- `delete()` - Delete model
- `refresh()` - Reload from database
- `toJSON()` - Convert to JSON object

### `@Attribute()` Decorator

Options:

- `primaryKey` - Mark as primary key
- `incrementingPrimaryKey` - Auto-incrementing primary key
- `required` - Field is required
- `default` - Default value
- `nullable` - Allow null values
- `columnName` - Custom column name in database

### `RelationshipFactory`

Methods:

- `createHasOne()` - One-to-one relationship
- `createHasMany()` - One-to-many relationship
- `createBelongsTo()` - Many-to-one relationship
- `createBelongsToMany()` - Many-to-many relationship
- `createMorphTo()` - Polymorphic relationship
- `createMorphMany()` - Polymorphic one-to-many

## Migration from Other ORMs

### From Sequelize

```ts
// Sequelize
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
});

// Neko ORM
export class User extends BaseModel {
  protected tableName = 'users';

  @Attribute()
  declare name: string;

  @Attribute()
  declare email: string;
}
```

### From TypeORM

```ts
// TypeORM
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

// Neko ORM
export class User extends BaseModel {
  protected tableName = 'users';

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare name: string;
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Packages

- [@devbro/neko-sql](https://www.npmjs.com/package/@devbro/neko-sql) - SQL query builder and database abstraction
- [@devbro/neko-cache](https://www.npmjs.com/package/@devbro/neko-cache) - Caching solution
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
