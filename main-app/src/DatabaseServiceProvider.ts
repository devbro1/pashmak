import { Middleware } from "neko-router";
import { Request, Response } from "neko-router";
import { PostgresqlConnection } from "neko-sql";
import { PoolConfig } from "pg";
import { Connection } from "neko-sql";
import { BaseModel } from "neko-orm";
import { ctx } from "neko-helper";
import config from "config";

export class DatabaseServiceProvider extends Middleware {
  async call(
    req: Request,
    res: Response,
    next: () => Promise<void>,
  ): Promise<void> {
    const db_configs: Record<string, PoolConfig & { name: string }> =
      config.get("databases");

    const conns = [];
    try {
      for (const [name, db_config] of Object.entries(db_configs)) {
        const conn = await this.getConnection(db_config);
        ctx().set(["database", name], conn);
        conns.push(conn);
      }
      BaseModel.setConnection(() =>
        ctx().getOrThrow<Connection>(["database", "default"]),
      );
      await next();
    } finally {
      for (const conn of conns) {
        await conn.disconnect();
      }
    }
  }

  private static instance: DatabaseServiceProvider;

  async register(): Promise<void> {}

  static getInstance(): DatabaseServiceProvider {
    if (!DatabaseServiceProvider.instance) {
      DatabaseServiceProvider.instance = new DatabaseServiceProvider();
    }
    return DatabaseServiceProvider.instance;
  }

  async getConnection(db_config: PoolConfig): Promise<PostgresqlConnection> {
    const conn = new PostgresqlConnection(db_config);
    if (!(await conn.connect())) {
      throw new Error("Failed to connect to the database");
    }
    return conn;
  }
}
