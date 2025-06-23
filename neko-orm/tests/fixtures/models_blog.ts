import { Attribute } from '../../src';
import { BaseModel } from '../../src/baseModel';
import { RelationshipFactory } from '../../src/relationships/RelationshipFactory';
import { Query } from 'neko-sql/src/Query';

export class User extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare username: string;

  profile() {
    return RelationshipFactory.createHasOne<User, Profile>({
      source: this,
      targetModel: Profile,
    });
  }

  posts() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        id: 'author_id',
      },
    });
  }

  topPosts() {
    return RelationshipFactory.createHasMany<User, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        id: 'author_id',
      },
      queryModifier: async (query: Query) => {
        return query.whereOp('rating', '>', 8);
      }
    });
  }
}

export class Profile extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare bio: string;

  @Attribute()
  declare user_id: number;

  user() {
    return RelationshipFactory.createBelongsTo <Profile, User>({
      source: this,
      targetModel: User,
    });
  }
}


export class Post extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare title: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  @Attribute()
  declare author_id: number;

  @Attribute()
  declare rating: number;

  author() {
    return RelationshipFactory.createBelongsTo<Post, User>({
      source: this,
      targetModel: User,
      sourceToTargetKeyAssociation: {
        author_id: 'id',
      },
    });
  }

  tags() {
    return RelationshipFactory.createBelongsToMany<Post, Tag>({
      source: this,
      targetModel: Tag,
    });
  }
}

export class Viewer extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare ip: string;
}

export class Comment extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare author: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  @Attribute()
  declare commentable_id: number;

  @Attribute()
  declare commentable_type: string;
}

export class Image extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare title: string;
}


export class Tag extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare name: string;

  posts() {
    return RelationshipFactory.createBelongsToMany<Tag, Post>({
      source: this,
      targetModel: Post,
    });
  }
}