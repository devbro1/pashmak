---
sidebar_position: 4
---

# ORM Relationships

neko-orm can handle relationship among models using `RelationshipFactory`.

### General vocabulary for relation ship

- source: the local or the model you are starting from
- target: the remote or the model(s) you are associating with
- junstion: or the junction table is the intermediary table used to manage M-to-M relationships

## 1-to-1 aka hasOne

first step is to define relation among models

```ts
class User extends BaseModel {
  session() {
    return RelationshipFactory.createHasOne<User, Session>({
      source: this,
      targetModel: Session,
    });
  }
}

class Session extends BaseModel {
  session() {
    return RelationshipFactory.createBelongsTo<Session, User>({
      source: this,
      targetModel: User,
    });
  }
}
```

to make the association, RelationshipFactory predicts possible name of forgein key. if you want to define your own or have multiple primary keys, then define `sourceToTargetKeyAssociation` in the options.

once the relationship is established you can get the child relationship

```ts
await user.session().get();
```

adding to a relationship

```ts
await user.session().associate(session);
```

removing from a relationship

```ts
await user.session().dessociate(session);
```

If you need to do the save step yourself just pass `sync:false`.

```ts
await user.session().associate(session, { sync: false });
await session.save();

await user.session().associate(session, { sync: false });
await session.save();
```

## 1-to-Many aka hasMany

first step is to define relation among models

```ts
class Post extends BaseModel {
  comments() {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
    });
  }
}

class Comment extends BaseModel {
  @Attribute()
  declare post_id: number;
}
```

to make the association, RelationshipFactory predicts possible name of forgein key. if you want to define your own or have multiple primary keys, then define `sourceToTargetKeyAssociation` in the options.

once the relationship is established you can iterate among children

```ts
for (const comment of await post.comments().toArray()) {
}
```

if you run into a situation where you have too many children then you can easily async iterate

```ts
for await (const comment of post.comments()) {
}
```

this approaches loads one model at a time from database.

adding to a relationship

```ts
await post.comments().associate(comment2);
await post.comments().associate([comments3, comments4]);
```

removing from a relationship

```ts
await post.comments().dessociate(comment2);
await post.comments().dessociate([comments3, comments4]);
```

If you need to do the save step yourself just pass `sync:false`.

```ts
await post.comments().associate(comment2, { sync: false });
await comment2.save();

await post.comments().dessociate(comment3, { sync: false });
await comment3.save();
```

## Many-to-1 aka belongsTo

As a reverse relationship of hasMany you can define it as such

```ts
class Comment extends BaseModel {
  post() {
    return RelationshipFactory.createBelongsTo<Comment, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        post_id: "id",
      },
    });
  }
}
```

## get relationship

since there is only 1 object that can be returned, use get() instead

```ts
let post = await comment.post().get();
```

## manage relationship

```ts
await comment.post().associate(post1);
await comment.post().dessociate(post1);

//faster way of dessociate
await comment.post().unlink();
```

keep in mind that these methods are modifying source(comment model) and leaving target model alone(post)

## Many to Many aka belongsToMany

To establish the relationship between two models:

```ts
export class Image extends BaseModel {
  @Attribute()
  declare author: string;

  @Attribute()
  declare filePath: number;

  @Attribute()
  declare title: number;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  tags() {
    return RelationshipFactory.createBelongsToMany<Image, Tag>({
      source: this,
      targetModel: Tag,
    });
  }
}

export class Tag extends BaseModel {
  @Attribute()
  declare name: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  images() {
    return RelationshipFactory.createBelongsToMany<Tag, Image>({
      source: this,
      targetModel: Image,
    });
  }
}
```

if you want to make further configurations you can:

```ts
images() {
  return RelationshipFactory.createBelongsToMany<Tag, Image>({
    source: this,
    targetModel: Image,
    junctionTable: 'image_tag',
    sourceToJunctionKeyAssociation: {id: image_id}, //id is image.id
    junctionToTargetAssociation: { tag_id: id} //id is tag.id
  });
}
```

to make association between new model objects:

```ts
await image1.tags().associate([tag1, tag2, tag3]);
```

and to remove:

```ts
await image1.tags().dessociate([tag1, tag2, tag3]);
```

NOTE: there is currently no sync=false for MtoM relationships

to get all associated models you can use toArray() or iteration

```ts
await image1.tags().toArray();
for await (const tag of image1.tags()) {
}
```

## queryModifier

In order to pull data from database, `RelationshipManager` will generate a query object. you will have an opportunity to modify this query object to further change which records are pulled. `queryModifier` can be an async method in case you need to `await` in your function.

```ts
export class Post extends BaseModel {
  // ...

  comments() {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
    });
  }

  commentsByAuthor(author: string) {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
      queryModifier: async (query: Query) => {
        query.whereOp("author", "=", author);
        return query;
      },
    });
  }

  // ...
}
```

in this example we created `commentsByAuthor(author)` that returns all comments with a given author name.
