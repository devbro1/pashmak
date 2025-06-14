import { Attribute } from '../../src';
import { BaseModel } from '../../src/baseModel';
import { RelationshipFactory } from '../../src/RelationshipFactory';

export class Post extends BaseModel {
  @Attribute()
  declare title: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  comments() {
    return RelationshipFactory.createHasMany<Post, Comment>({
      source: this,
      targetModel: Comment,
    });
  }
}

export class Comment extends BaseModel {
  @Attribute()
  declare author: string;

  @Attribute()
  declare content: string;

  @Attribute()
  declare created_at: Date;

  @Attribute()
  declare updated_at: Date;

  @Attribute()
  declare post_id: number;

  post() {
    return RelationshipFactory.createBelongsTo<Comment, Post>({
      source: this,
      targetModel: Post,
      sourceToTargetKeyAssociation: {
        post_id: 'id',
      },
    });
  }
}
