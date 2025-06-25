import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection, Connection } from 'neko-sql';
import { execSync } from 'child_process';
import { User, Profile, Post, Comment, Image, Tag, Viewer } from '../fixtures/models_blog';
import { BaseModel } from '../../src';
import { faker } from '@faker-js/faker';

describe('relationships', () => {
  let conn: Connection;

  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
      host: process.env.DB_HOST,
      database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };
    execSync(
      `psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
    );
    execSync(
      `psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_blog_db_pg.sql ${db_config.database}`
    );
    conn = new PostgresqlConnection(db_config);
    await conn.connect();
    BaseModel.setConnection(() => conn);

    console.log('Connected to PostgreSQL database:', db_config.database);
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test.only('user and profile 1to1', async () => {
    let user1: User = await User.create({
      username: faker.internet.username(),
    });

    let user2: User = await User.create({
      username: faker.internet.username(),
    });

    let user3: User = await User.create({
      username: faker.internet.username(),
    });

    let profile1: Profile = await Profile.create({
      bio: faker.lorem.paragraph(),
    });

    let profile2: Profile = await Profile.create({
      bio: faker.lorem.paragraph(),
      user_id: user2.id,
    });

    let profile3: Profile = await Profile.create({
      bio: faker.lorem.paragraph(),
    });

    expect(await user2.profile().get()).toBeDefined();
    expect((await user2.profile().get())!.id).toBe(profile2.id);

    await user1.profile().associate(profile1);
    expect((await user1.profile().get())!.id).toBe(profile1.id);

    await user2.profile().dessociate(profile2);
    expect(await user2.profile().get()).toBeUndefined();

    await user3.profile().associate(profile3, { sync: false });
    expect(await user3.profile().get()).toBeUndefined();
    await profile3.save();
    expect((await user3.profile().get())!.id).toBe(profile3.id);
    await user3.profile().dessociate(profile3, { sync: false });
    expect(await user3.profile().get()).toBeDefined();
    await profile3.save();
    expect(await user3.profile().get()).toBeUndefined();

    expect(await profile3.user().get()).toBeUndefined();
    await profile3.user().associate(user3);
    expect((await profile3.user().get())!.id).toBe(user3.id);
    await profile3.user().dessociate(user3);
    expect(await profile3.user().get()).toBeUndefined();
  });

  test('user hasMany posts 1toM', async () => {
    let user1: User = await User.create({
      username: faker.internet.username(),
    });

    let user2: User = await User.create({
      username: faker.internet.username(),
    });

    let post1: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user1.id,
    });

    let post2: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user1.id,
    });

    let post3: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user2.id,
    });

    expect((await user1.posts().toArray()).length).toBe(2);
    expect((await user2.posts().toArray()).length).toBe(1);

    expect((await post1.author().get())!.id).toBe(user1.id);
    expect((await post2.author().get())!.id).toBe(user1.id);
    expect((await post3.author().get())!.id).toBe(user2.id);

    await user1.posts().dessociate(post2);
    expect((await user1.posts().toArray()).length).toBe(1);
    expect(await post2.author().get()).toBeUndefined();
    await post2.refresh();
    expect(post2.author_id).toBeUndefined();
    await post2.author().associate(user2);
    expect((await post2.author().get())!.id).toBe(user2.id);
  });

  test('post is visited by many viewers MtoM', async () => {
    let post1: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let post2: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let post3: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let viewer1: Viewer = await Viewer.create({
      ip: faker.internet.ip(),
    });

    let viewer2: Viewer = await Viewer.create({
      ip: faker.internet.ip(),
    });

    let viewer3: Viewer = await Viewer.create({
      ip: faker.internet.ip(),
    });

    await post1.viewers().associate([viewer1, viewer2]);
    await post2.viewers().associate([viewer2, viewer3]);

    expect((await post1.viewers().toArray()).length).toBe(2);
    expect((await post2.viewers().toArray()).length).toBe(2);
    expect((await post3.viewers().toArray()).length).toBe(0);

    expect((await viewer1.posts().toArray()).length).toBe(1);
    expect((await viewer2.posts().toArray()).length).toBe(2);
    expect((await viewer3.posts().toArray()).length).toBe(1);

    await viewer3.posts().associate(post3);
    await viewer2.posts().dessociate(post1);

    expect((await post1.viewers().toArray()).length).toBe(1);
    expect((await post2.viewers().toArray()).length).toBe(2);
    expect((await post3.viewers().toArray()).length).toBe(1);
    expect((await viewer1.posts().toArray()).length).toBe(1);
    expect((await viewer2.posts().toArray()).length).toBe(1);
    expect((await viewer3.posts().toArray()).length).toBe(2);
  });

  test('queryModifier', async () => {
    let user1: User = await User.create({
      username: faker.internet.username(),
    });

    let post1: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user1.id,
      rating: 3,
    });

    let post2: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user1.id,
      rating: 9,
    });

    let post3: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
      author_id: user1.id,
      rating: 10,
    });

    expect((await user1.posts().toArray()).length).toBe(3);
    let posts = await user1.topPosts().toArray();
    let post_ids = posts.map((p) => p.id);
    expect(posts.length).toBe(2);
    expect(post_ids).not.toContain(post1.id);
    expect(post_ids).toContain(post2.id);
    expect(post_ids).toContain(post3.id);
  });

  test('post and images have many comments 1toM, 1to1', async () => {
    let user1: User = await User.create({
      username: faker.internet.username(),
    });

    let post1: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let post2: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let image1: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let image2: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let image3: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let comment1 = await Comment.create<Comment>({
      content: faker.lorem.sentence(),
      author_id: user1.id,
    });

    let comment2 = await Comment.create<Comment>({
      content: faker.lorem.sentence(),
      author_id: user1.id,
    });

    let comment3 = await Comment.create<Comment>({
      content: faker.lorem.sentence(),
      author_id: user1.id,
    });

    image1.comments().associate(comment1);
    post1.comments().associate(comment2);

    await comment1.refresh();
    await comment2.refresh();
    await comment3.refresh();

    expect(comment1.commentable_type).toBe('image');
    expect(comment1.commentable_id).toBe(image1.id);
    expect(comment2.commentable_type).toBe('post');
    expect(comment2.commentable_id).toBe(post1.id);
    expect(comment3.commentable_type).toBeUndefined();
    expect(comment3.commentable_id).toBeUndefined();

    image1.comments().associate(comment3, { sync: false });
    await comment3.refresh();
    expect(comment3.commentable_type).toBeUndefined();
    expect(comment3.commentable_id).toBeUndefined();
    image1.comments().associate(comment3, { sync: false });
    expect(comment3.commentable_type).toBe('image');
    expect(comment3.commentable_id).toBe(image1.id);
    expect((await image1.comments().toArray()).length).toBe(1);
    await comment3.save();
    expect((await image1.comments().toArray()).length).toBe(2);
    image1.comments().dessociate(comment3, { sync: false });
    expect((await image1.comments().toArray()).length).toBe(2);
    await comment3.refresh();
    expect(comment3.commentable_type).toBe('image');
    expect(comment3.commentable_id).toBe(image1.id);
    image1.comments().dessociate(comment3, { sync: false });
    await comment3.save();
    expect(comment3.commentable_type).toBeUndefined();
    expect(comment3.commentable_id).toBeUndefined();

    expect((await image1.comments().toArray()).length).toBe(1);
    image1.comments().dessociate(comment1);
    expect((await image1.comments().toArray()).length).toBe(0);
  });

  test('post and image have many tags MtoM', async () => {
    let post1: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let post2: Post = await Post.create({
      title: faker.lorem.words(3),
      content: faker.lorem.words(10),
    });

    let image1: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let image2: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let image3: Image = await Image.create({
      title: faker.lorem.words(2),
    });

    let tag1: Tag = await Tag.create({
      name: faker.lorem.word(),
    });

    let tag2: Tag = await Tag.create({
      name: faker.lorem.word(),
    });

    let tag3: Tag = await Tag.create({
      name: faker.lorem.word(),
    });

    await post1.tags().associate([tag1, tag2]);
    await image1.tags().associate([tag2, tag3]);
    expect((await post1.tags().toArray()).length).toBe(2);
    expect((await image1.tags().toArray()).length).toBe(2);

    await post1.tags().dessociate(tag2);
    expect((await post1.tags().toArray()).length).toBe(1);
    expect((await image1.tags().toArray()).length).toBe(2);
  });
});
