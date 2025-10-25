import { Middleware } from "@devbro/neko-router";
import { Request, Response } from "@devbro/neko-router";
import { PostgresqlConnection } from "@devbro/neko-sql";
import { PoolConfig } from "pg";
import { Connection } from "@devbro/neko-sql";
import { BaseModel } from "@devbro/neko-orm";
import { ctx } from "@devbro/neko-context";
import { config } from "@devbro/neko-config";
import { Global } from "./global.mjs";

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
      BaseModel.setConnection(() => {
        const key = ["database", "default"];
        let rc: Connection | undefined;

        if (ctx.isActive()) {
          rc = ctx().get<Connection>(key);
        } else if (Global.has(key)) {
          rc = Global.get<Connection>(key);
        } else {
          rc = await this.getConnection(db_configs["default"]);
          Global.set(key, rc);
        }

        return rc!;
      });
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

  getConnection(db_config: PoolConfig): Connection {
    const conn = new PostgresqlConnection(db_config);
    if (!conn.isConnected()) {
      conn.connect();
    }
    return conn;
  }
}
