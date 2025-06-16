---
sidebar_position: 4
---

# ORM Relationships

neko-orm can handle relationship among models using `RelationshipFactory`.

### General vocabulary for relation ship

- source: the local or the model you are starting from
- target: the remote or the model(s) you are associating with
- junstion: or the junction table is the intermediary table used to manage M-to-M relationships

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

### adding to a relationship

```ts
await post.comments().associate(comment2);
await post.comments().associate([comments3, comments4]);
```

### removing from a relationship

```ts
await post.comments().dessociate(comment2);
await post.comments().dessociate([comments3, comments4]);
```

### making associations without changing db

if you need to do the save step yourself just pass `sync:false`.

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
