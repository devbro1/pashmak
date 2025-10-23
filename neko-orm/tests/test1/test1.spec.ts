import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { PostgresqlConnection, Connection } from '@devbro/neko-sql';
import { execSync } from 'child_process';
import { faker } from '@faker-js/faker';

// function Attribute(options: any = {}) {
//   return function (target: any, propertyKey: string) {
//     console.log('ttt',target, target._fillable, propertyKey);

//     console.log('qwe', target._fillable);
//     console.log(Object.getOwnPropertyNames(target));
//     Object.defineProperty(target, '_fillable', {
//       value: [...(target._fillable || []), propertyKey],
//       writable: true,
//       configurable: true,
//       enumerable: true,
//     });

//     Object.defineProperty(target, '_attributes', {
//       value: {...(target._attributes || {}), [propertyKey]: options.default || undefined},
//       writable: true,
//       configurable: true,
//       enumerable: true,
//     });

//     Object.defineProperty(target, propertyKey, {
//       get() {
//         this._attributes;
//         console.log('getter called');
//         return this._attributes[propertyKey];
//       },
//       set(value: any) {
//         console.log('setter called with', value);
//         this._attributes[propertyKey] = value;
//       },
//       configurable: true,
//       enumerable: true,
//       // writable: true,
//       // value: undefined,
//     });

//     target._helpers = {... (target._helpers || {}), [propertyKey]: () => { console.log('helper called',propertyKey); } };

//     return target;
//   };
// }

// class BaseModel {
// static tableName = 'users';
//   declare _fillable: string[];
//   declare _attributes: any;

//   constructor(initialData: any = {}) {
//     console.log('User constructor', this.constructor.prototype);
//     //Object.assign(this._fillable, this.constructor._fillable);
//     console.log('qweqwe', this._attributes);
//   }

//   static getQuery(): any {
//     return "from parent class";
//   }

//   toJson() {
//     return this._attributes;
//   }
// }

// class User extends BaseModel {
//   @Attribute()
//   declare age: number;

//   @Attribute({
//     default: "asd",
//   })
//   declare name: string;

//   static getQuery() {
//     return super.getQuery() + 'AAAAAAA';
//   }

//   meow() {
//     return this.constructor.getQuery();
//   }
// }

describe('random tests', () => {
  // let conn: Connection;

  // beforeAll(async () => {
  //   const randName = Math.random().toString(36).substring(7);
  //   const db_config = {
  //     host: process.env.DB_HOST,
  //     database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
  //     user: process.env.DB_USER,
  //     password: process.env.DB_PASSWORD,
  //     port: parseInt(process.env.DB_PORT || '5432'),
  //   };
  //   execSync(
  //     `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`
  //   );
  //   execSync(
  //     `PGPASSWORD=${db_config.password} psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_blog_db_pg.sql ${db_config.database}`
  //   );
  //   conn = new PostgresqlConnection(db_config);
  //   await conn.connect();
  //   BaseModel.setConnection(() => conn);

  //   console.log('Connected to PostgreSQL database:', db_config.database);
  // });

  // afterAll(async () => {
  //   await conn?.disconnect();
  // });

  // test('user and profile 1to1', async () => {
  //   console.log('User', User.toString());
  //   let user = new User();
  //   user.age = 500;
  //   console.log(user.age);
  //   console.log('user', user);
  //   console.log(JSON.stringify(user));
  //   console.log(user.toJson());
  //   console.log('query', User.getQuery());
  //   console.log('query', user.meow());
  // });

  test('P1', async () => {});
});
