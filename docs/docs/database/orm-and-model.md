---
sidebar_position: 4
---

# ORM and Models

The aim is to make accessing database easier and more friendly using objects.

to create a new model:

```typescript
import { BaseModel, Attribute } from "@devbro/pashmak/orm";

export class User extends BaseModel {
  protected guarded: string[] = ["password"];

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number;

  @Attribute()
  declare username: string;

  @Attribute()
  active: boolean = true;

  @Attribute()
  declare password: string;
}
```

every attribute that comes from database must get a @Attribute() decorator. It will tell the model what needs to be loaded or saved to database.

## primary key

every model will need a unique identified that you mark using `primaryKey:true`. If the value of your primary key is auto-calculated in the database during insert, then `incrementingPrimaryKey: true` will let model know to get the newly generated id after create.

## guarded

if you want to mark a attribute as sensetive, you can use guarded to tell the model to not include it when we call toJson();

## toJson()

you can convert a model object to a json using `toJson()` to send or save clean data.

## save()

to save your data to database, if it is an object that was retrieved from database, then it will update database.

## delete()

to delete the model from database. data still reside in the object.

## Model.create()

to Quickly create a new object that is saved to database

```ts
let comment = await Comment.create<Comment>({
  author: "Tiger Cat",
  comment: "story of my life",
});
```

## table name

table name is auto calculated as plural of the model name. so Country model will look rows from countries table.

if you want to override the table name:

```
protected tableName: string = 'mars_countries';
```

## creating a new model

```
let user = new User();
user.fill({ username: 'meowadmin' });
// or
let user = new User({ username: 'meowadmin' });
```

only parameters marked with @attribute will be filled.

## Generally Available methods

### refresh()

sometimes you need to reload data from database. you can do this by

```ts
console.log(user.username); // meow
user.username = "newusername";
console.log(user.username); // newusername
await user.refresh();
console.log(user.username); // meow
```

### find() / findByPrimaryKey()

assuming you are using `id` as your primary key, you can find objects by id

```ts
await User.find(123);
await User.findByPrimaryKey(123);
```

if find fails, it will return undefined

### findOrFail()

same as `find()` but will throw an error on failure

### findOne()

it will return the first object that matches the search matches you provide.

```ts
await USer.findOne({ username: "meowadmin" });
```

note: the search parameters need to be exact match. they also can be anything defined in database but not in your model.

### getQuery()

returns a query object with table predefined

```ts
await User.getQuery();
```

### fill()

to mass field parameters in a object

```ts
user.fill({ email: "meow@devbro.com" });
```

### `created_at` and `updated_at` timestamps

every model comes with standard `created_at` and `updated_at` fields. you can use these fields to track when they were created and updated last.

to modify standard behaviors you can define your models as such:

```ts
class Animal extends BaseModel {
  protected hasTimestamps = true;
  protected timestampFormat = "yyyy-MM-dd HH:mm:ss.SSS";
  protected createdAtFieldName = "created_at";
  protected updatedAtFieldName = "updated_at";

  @Attribute()
  declare created_at: Date;

  @attribute()
  declare updated_at: Date;
}
```

- hasTimestamps: controls if class has time stamp fields or not. you can set to false if your model does not have these fields.
- timestampFormat: the format timestamp needs to be converted to in string before inserting to database.
- createdAtFieldName: the field name that will contain created_at date
- updatedAtFeildName: the field name that contains updated_at date

these values are calculated automatically during save(). if save() is successfull created_at and updated_at will be adjust in the model.

if you want to run save() without update timestamps then:

```ts
await cat.save({ updateTimestamps: false });
```

## Casters and Mutators

casters can be used to modify the field when we read it from database.
mutators can be used to modify the data when we write it to database.

```mermaid
graph LR
  Controller --> Model
  Model -->|Caster| Database
  Database -->|Mutator| Model
  Model --> Controller
```

you can define casters and mutators for an attributes

```ts
@attributes({
  caster: (val: Date) => val.toISOString(),
  mutator: (val: string) => parseStringToDate(val),
})
declare date_of_birth: Date;
```

## Scopes

Scopes is the concept of adding extra limitations to queries used within ORM.

There are two types of scopes you can use Global vs Local.

### Global Scopes

Global scopes are autoloaded by the model on every query request.

```ts
class Region2 extends GlobalScope {
  public async apply(query: Query): Promise<Query> {
    let region_id = ctx().get<User>("authenticated_user").region_id;
    return query.whereOp("region_id", "=", region_id);
  }
}

class HasIinName extends GlobalScope {
  public async apply(query: Query): Promise<Query> {
    return query.whereOp("country_name", "ILIKE", "%I%");
  }
}

class Country2 extends BaseModel {
  protected tableName: string = "countries";
  protected hasTimestamps: boolean = false;
  scopes = [Region2, HasIinName];

  @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;

  regions(): Region[] {
    return [];
  }
}

let countries = await (await Country2.getQuery()).get();
```

One advantage of GlobalScope is you can use one for multiple models.
Main use case for globalScope is use with Authorization logic where you can limit
access to records before they are loaded from database.

### Local Scope

There may be situations that you want easier to read queries OR your query logics are too complicated to rewrite in multiple places.
so you can use a local scope to inject code into Query of a model

```ts
class Country extends BaseModel {
  protected tableName: string = "countries";
  protected hasTimestamps: boolean = false;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: false })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;

  regions(): Region[] {
    return [];
  }

  public static getLocalScopesQuery() {
    return class extends LocalScopeQuery<Country> {
      protected getModel(): new () => Country {
        return Country;
      }

      region(region_id: number) {
        this.whereOp("region_id", "=", region_id);
        return this;
      }

      nameLike(name: string) {
        this.whereOp("country_name", "ILIKE", `%${name}%`);
        return this;
      }
    };
  }
}

let result = await (await Country.getQuery())
  .nameLike("united")
  .region(2)
  .get();
```

### getLocalScopesQuery class

this class added a few extra localscope functions that can help with casting.

```ts
let c1_obj = await (await Country.getQuery()).region(1).getObject(); // return an object of type Country or undefined

let c1_objs = await (await Country.getQuery()).region(1).getObjects(); // return an array of type Country, or array will be empty if none match
```
