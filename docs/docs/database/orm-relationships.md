---
sidebar_position: 4
---

# ORM Relationships

neko-orm can handle relationship among models using `RelationshipFactory`.

### General vocabulary for relation ship

- source: the local or the model you are starting from
- target: the remote or the model(s) you are associating with
- pivot: or the junction table is the intermediary table used to manage M-to-M relationships

### Sample data structure

Examples and test code is based on the following database design:

```mermaid
erDiagram
  users ||--|| profiles : 1to1

  users ||--o{ posts : 1toM

  posts }o..o{ viewers: "MtoM(using post_viewer)"
  viewers |o--o{ post_viewer : 1toM
  posts |o--o{ post_viewer : 1toM


  posts |o--o{ taggables : belongsToMany-PolyMorphic
  images |o--o{ taggables : belongsToMany-PolyMorphic
  posts }o..o{ tags : "polymorphic MtoM(through taggables)"
  images }o..o{ tags : "polymorphic MtoM(through taggables)"
  taggables }|--|| tags: 1toM


  comments }o--o| posts : 1toM-PolyMorphic
  comments }o--o| images : 1toM-PolyMorphic

users {
    number id PK
}

profiles {
    number id PK
    number user_id "references user.id"
}

posts {
    number id PK
    number author_id "references user.id"
}

viewers {
  number id PK
}

post_viewer:::JunctionTableClass {
  number id PK
  number post_id "ref post.id"
  number viewer_id "ref viewer.id"
}

images {
  number id PK
}

comments {
  number id PK
  string commentable_id "ref image.id or post.id"
  string commentable_type "image or post"
}

tags {
  number id PK
}

taggables:::JunctionTableClass {
  number id PK
  number tag_id "ref tag.id"
  string taggable_type "image or post"
  number taggable_id "ref image.id or post.id"
}

classDef JunctionTableClass fill:#f96
```

`post_viewer` and `taggables` are junction(aka intermediary, pivot) tables to help with MtoM relationships, there is no model for them.

## 1-to-1 aka hasOne

first step is to define relation among models

```ts
class User extends BaseModel {
  profile() {
    return RelationshipFactory.createHasOne<User, Profile>({
      source: this,
      targetModel: Profile,
    });
  }
}

class Profile extends BaseModel {
  session() {
    return RelationshipFactory.createBelongsTo<Profile, User>({
      source: this,
      targetModel: User,
    });
  }
}
```

to make the association, RelationshipFactory predicts possible name of forgein key. if you want to define your own or have multiple primary keys, then define `sourceToTargetKeyAssociation` in the options.

once the relationship is established you can get the child relationship

```ts
await user.profile().get();
```

adding to a relationship

```ts
await user.profile().associate(profile);
```

removing from a relationship

```ts
await user.profile().dessociate(profile);
```

If you need to do the save step yourself just pass `sync:false`.

```ts
await user.profile().associate(profile, { sync: false });
await profile.save();

await user.session().associate(profile, { sync: false });
await profile.save();
```

## 1-to-Many aka hasMany

first step is to define relation among models

```ts
class User extends BaseModel {
  comments() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
    });
  }
}
```

to make the association, RelationshipFactory predicts possible name of forgein key. if you want to define your own or have multiple primary keys, then define `sourceToTargetKeyAssociation` in the options.

once the relationship is established you can iterate among children

```ts
for (const post of await user.posts().toArray()) {
}
```

if you run into a situation where you have too many children then you can easily async iterate

```ts
for await (const post of user.posts()) {
}
```

this approaches loads one model at a time from database.

adding to a relationship

```ts
await user.posts().associate(post1);
await user.posts().associate([post2, post3]);
```

removing from a relationship

```ts
await user.posts().dessociate(post1);
await user.posts().dessociate([post2, post3]);
```

If you need to do the save step yourself just pass `sync:false`.

```ts
await user.posts().associate(post1, { sync: false });
await post1.save();

await user.posts().dessociate(post1, { sync: false });
await post1.save();
```

## Many-to-1 aka belongsTo

As a reverse relationship of hasMany you can define it as such

```ts
class Post extends BaseModel {
  @Attribute()
  declare author_id: number;

  author() {
    return RelationshipFactory.createBelongsTo<Post, User>({
      source: this,
      targetModel: User,
      sourceToTargetKeyAssociation: {
        author_id: "id",
      },
    });
  }
}
```

## get relationship

since there is only 1 object that can be returned, use get() instead

```ts
let author = await post.author().get();
```

## manage relationship

```ts
await post.author().associate(author);
await post.author().dessociate(author);

//faster way of dessociate
await post.author().unlink();
```

keep in mind that these methods are modifying source(post model) and leaving target model alone(user)

## Many to Many aka belongsToMany

To establish the relationship between two models:

```ts
export class Viewer extends BaseModel {
  posts() {
    return RelationshipFactory.createBelongsToMany<Viewer, Post>({
      source: this,
      targetModel: Post,
    });
  }
}

export class Tag extends BaseModel {
  viewer() {
    return RelationshipFactory.createBelongsToMany<Post, Viewer>({
      source: this,
      targetModel: Viewer,
    });
  }
}
```

if you want to make further configurations you can:

```ts
posts() {
  return RelationshipFactory.createBelongsToMany<Viewer, Post>({
    source: this,
    targetModel: Post,
    junctionTable: 'post_viewer',
    sourceToJunctionKeyAssociation: {id: viewer_id}, //id is viewer.id
    junctionToTargetAssociation: { post_id: id} //id is post.id
  });
}
```

to make association between new model objects:

```ts
await post.viewers().associate([viewer1, viewer2, viewer3]);
```

and to remove:

```ts
await post.viewers().dessociate([viewer1, viewer2, viewer3]);
```

NOTE: there is currently no sync=false for MtoM relationships

to get all associated models you can use toArray() or iteration

```ts
await post.viewers().toArray();
for await (const viewer of post.viewers()) {
}
```

## queryModifier

In order to pull data from database, `RelationshipManager` will generate a query object. you will have an opportunity to modify this query object to further change which records are pulled. `queryModifier` can be an async method in case you need to `await` in your function.

```ts
export class User extends BaseModel {
  // ...

  posts() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        id: "author_id",
      },
    });
  }

  topPosts() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        id: "author_id",
      },
      queryModifier: async (query: Query) => {
        return query.whereOp("rating", ">", 8); //where posts.rating > 0
      },
    });
  }

  // ...
}
```

## Polymorphism

Polymorphism referes to the concept where two different type of models can relate to same object. for example, image and posts can have comments.
