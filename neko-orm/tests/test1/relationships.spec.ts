import { describe, expect, test } from '@jest/globals';
import { PostgresqlConnection } from 'neko-sql/src/databases/postgresql/PostgresqlConnection';
import { Connection } from 'neko-sql/src/Connection';
import { execSync } from 'child_process';
import { User, Profile, Post, Comment, Image, Tag } from '../fixtures/models_blog';
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

  test('user and profile 1to1', async () => {
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
    expect((await user2.profile().get())).toBeUndefined();

    await user3.profile().associate(profile3, { sync: false });
    expect((await user3.profile().get())).toBeUndefined();
    await profile3.save();
    expect((await user3.profile().get())!.id).toBe(profile3.id);
    await user3.profile().dessociate(profile3, { sync: false });
    expect((await user3.profile().get())).toBeDefined();
    await profile3.save();
    expect((await user3.profile().get())).toBeUndefined();

    expect((await profile3.user().get())).toBeUndefined();
    await profile3.user().associate(user3);
    expect((await profile3.user().get())!.id).toBe(user3.id);
    await profile3.user().dessociate(user3);
    expect((await profile3.user().get())).toBeUndefined();

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
    expect((await post2.author().get())).toBeUndefined();
    await post2.refresh();
    expect(post2.author_id).toBeUndefined();
    await post2.author().associate(user2);
    expect((await post2.author().get())!.id).toBe(user2.id);
  });

  test('post contains many links MtoM', async () => {
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
    await post2.tags().associate([tag2, tag3]);

    expect((await post1.tags().toArray()).length).toBe(2);
    expect((await post2.tags().toArray()).length).toBe(2);
    expect((await post3.tags().toArray()).length).toBe(0);

    expect((await tag1.posts().toArray()).length).toBe(1);
    expect((await tag2.posts().toArray()).length).toBe(2);
    expect((await tag3.posts().toArray()).length).toBe(1);

    await tag3.posts().associate(post3);
    await tag2.posts().dessociate(post1);

    expect((await post1.tags().toArray()).length).toBe(1);
    expect((await post2.tags().toArray()).length).toBe(2);
    expect((await post3.tags().toArray()).length).toBe(1);
    expect((await tag1.posts().toArray()).length).toBe(1);
    expect((await tag2.posts().toArray()).length).toBe(1);
    expect((await tag3.posts().toArray()).length).toBe(2);
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
    let post_ids = posts.map(p => p.id);
    expect((posts).length).toBe(2);
    expect(post_ids).not.toContain(post1.id);
    expect(post_ids).toContain(post2.id);
    expect(post_ids).toContain(post3.id);
  });


  test('post and images have many comments 1toM, 1to1', async() => {
  //   let car1 = await Car.create({});
  //   let bike1 = await Bike.create({});
  //   let unicycle = await Unicycle.create({});

  //   let tire1 = await Tire.create({});
  //   let tire2 = await Tire.create({});
  //   let tire3 = await Tire.create({});
  //   let tire4 = await Tire.create({});

  //   await car1.tires().associate([tire1,tire2]);
  //   await bike1.tires().associate([tire3]);
  //   await unicycle.tire().associate(tire4);

  //   expect(tire1.tireable_type).toBe('car');
  //   expect(tire2.tireable_type).toBe('car');
  //   expect(tire3.tireable_type).toBe('bike');
  //   expect(tire4.tireable_type).toBe('unicycle');
  //   expect(tire1.tireable_id).toBe(car1.id);
  //   expect(tire2.tireable_id).toBe(car1.id);
  //   expect(tire3.tireable_id).toBe(bike1.id);
  //   expect(tire4.tireable_id).toBe(unicycle.id);

  //   expect((await tire1.car().get()).id).toBe(car1.id);
  //   expect((await tire1.bike().get())).toBeUndefined();

  //   expect((await tire2.car().get()).id).toBe(car1.id);
  //   expect((await tire2.bike().get())).toBeUndefined();

  //   expect((await tire3.car().get())).toBeUndefined();
  //   expect((await tire3.bike().get()).id).toBe(bike1.id);

  //   expect((await tire4.car().get())).toBeUndefined();
  //   expect((await tire4.unicycle().get()).id).toBe(unicycle.id);
  });

  test('post and image have many tags MtoM', async () => {
  //   let post1 = await Post.create({
  //     title: faker.lorem.sentence(),
  //     content: faker.lorem.paragraph(),
  //   });

  //   let image1 = await Image.create({
  //   });
  });
});
