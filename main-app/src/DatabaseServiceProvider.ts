import { Middleware } from "neko-router/src";
import { Request, Response } from "neko-router/src/types";
import { PostgresqlConnection } from "neko-sql/src/databases/postgresql/PostgresqlConnection";
import { PoolConfig } from "pg";
import { Connection } from "neko-sql/src/Connection";
import { BaseModel } from "neko-orm/src/baseModel";
import { ctx } from "neko-http/src";

export class DatabaseServiceProvider extends Middleware {
  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    const db = DatabaseServiceProvider.getInstance();
    const conn = await db.getConnection();
    // @ts-ignore
    ctx().get<Request>("request").context = { dd: "cc" };
    try {
      ctx().set("db", conn);
      BaseModel.setConnection(() => ctx().getOrThrow<Connection>("db"));
      await next();
    } catch (err) {
      throw err;
    } finally {
      await conn.disconnect();
    }
  }

  private static instance: DatabaseServiceProvider;
  private conn: PostgresqlConnection | undefined;

  async register(): Promise<void> {}

  static getInstance(): DatabaseServiceProvider {
    if (!DatabaseServiceProvider.instance) {
      DatabaseServiceProvider.instance = new DatabaseServiceProvider();
    }
    return DatabaseServiceProvider.instance;
  }

  async getConnection(): Promise<PostgresqlConnection> {
    const db_config: PoolConfig = {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME || "test_db",
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || "5432"),
    };

    const conn = new PostgresqlConnection(db_config);
    if (!(await conn.connect())) {
      throw new Error("Failed to connect to the database");
    }
    return conn;
  }
}
