import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection } from 'neko-sql/src/databases/postgresql/PostgresqlConnection';
import { Connection } from 'neko-sql/src/Connection';
import { execSync } from 'child_process';
import { Post, Comment } from '../fixtures/models_blog';
import { BaseModel } from '../../src';
import { faker } from '@faker-js/faker';
import { sleep } from 'neko-helper/src/time';

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
  });

  afterAll(async () => {
    await conn?.disconnect();
  });

  test('post can have many comments', async () => {
    let post1: Post = await Post.find(1);

    let counter = 0;
    for await (const comment of post1.comments()) {
      expect(comment.post_id).toBe(post1.id);
      expect(comment).toBeInstanceOf(Comment);
      counter++;
    }
    expect(counter).toBe(5);

    let post2 = await Post.find(2);
    expect(post2.id).toBe(2);
    let comments2 = await post2.comments().toArray();
    expect(comments2.length).toBe(5);
    for (const comment of comments2) {
      expect(comment.post_id).toBe(post2.id);
      expect(comment).toBeInstanceOf(Comment);
      expect(comment.id).toBeDefined();
    }

    let comment1 = new Comment({
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
    });
    await post1.comments().associate(comment1);
    expect((await post1.comments().toArray()).length).toBe(6);

    let comment2 = new Comment({
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
    });
    let comment3 = new Comment({
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
    });

    await post1.comments().associate([comment2, comment3]);
    expect((await post1.comments().toArray()).length).toBe(8);

    let comment4 = new Comment({
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
    });

    await comment4.save();
    expect((await post1.comments().toArray()).length).toBe(8);
    await post1.comments().associate(comment4, { sync: false });
    expect((await post1.comments().toArray()).length).toBe(8);
    await comment4.save();
    expect((await post1.comments().toArray()).length).toBe(9);
    await post1.comments().dessociate(comment4, { sync: false });
    expect((await post1.comments().toArray()).length).toBe(9);
    await comment4.save();
    expect((await post1.comments().toArray()).length).toBe(8);

    await post1.comments().dessociate([comment2, comment3]);
    expect((await post1.comments().toArray()).length).toBe(6);
  });

  test('comment can belong to a post', async () => {
    let post1 = await Post.create({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraph(),
    });

    let comment1 = await Comment.create<Comment>({
      content: faker.lorem.sentence(),
      author: faker.person.fullName(),
      post_id: post1.id,
    });

    let post2 = await comment1.post().get();
    expect(post2.id).toBe(post1.id);

    await comment1.post().dessociate(post2);
    expect(comment1.post_id).toBeUndefined();
    await comment1.refresh();
    expect(comment1.post_id).toBeUndefined();

    await comment1.post().associate(post2, { sync: false });
    expect(comment1.post_id).toBe(post2.id);
    await comment1.refresh();
    expect(comment1.post_id).toBeUndefined();

    await comment1.post().associate(post2);
    expect(comment1.post_id).toBe(post2.id);
    await comment1.refresh();
    expect(comment1.post_id).toBeDefined();
  });
});
