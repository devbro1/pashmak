import { Attribute } from '../../src';
import { BaseModel } from '../../src/baseModel.mjs';
import { RelationshipFactory } from '../../src/relationships/RelationshipFactory';
import { Query } from '@devbro/neko-sql';

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
      },
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
    return RelationshipFactory.createBelongsTo<Profile, User>({
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

  comments() {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
      morphIdentifier: 'commentable',
    });
  }

  viewers() {
    return RelationshipFactory.createBelongsToMany<Post, Viewer>({
      source: this,
      targetModel: Viewer,
      junctionTable: 'post_viewer',
      sourceToJunctionKeyAssociation: {
        id: 'post_id',
      },
      junctionToTargetAssociation: {
        viewer_id: 'id',
      },
    });
  }

  tags() {
    return RelationshipFactory.createMorphedBelongsToMany<Post, Tag>({
      source: this,
      targetModel: Tag,
      junctionTable: 'taggables',
      morphIdentifier: 'taggable',
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

  posts() {
    return RelationshipFactory.createBelongsToMany<Viewer, Post>({
      source: this,
      targetModel: Post,
      junctionTable: 'post_viewer',
      sourceToJunctionKeyAssociation: {
        id: 'viewer_id',
      },
      junctionToTargetAssociation: {
        post_id: 'id',
      },
    });
  }
}

export class Comment extends BaseModel {
  @Attribute({
    primaryKey: true,
  })
  declare id: number;

  @Attribute()
  declare author_id: number;

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

  comments() {
    return RelationshipFactory.createHasMany<Image, Comment>({
      source: this,
      targetModel: Comment,
      morphIdentifier: 'commentable',
    });
  }

  tags() {
    return RelationshipFactory.createMorphedBelongsToMany<Image, Tag>({
      source: this,
      targetModel: Tag,
      junctionTable: 'taggables',
      morphIdentifier: 'taggable',
    });
  }
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
