import { PostgresqlConnection } from "neko-sql/src/databases/postgresql/PostgresqlConnection";
import { Connection, PoolClient, PoolConfig } from "pg";

export class DatabaseServiceProvider {
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
      max: 3,
    };

    const conn = new PostgresqlConnection(db_config);
    if (!(await conn.connect())) {
      throw new Error("Failed to connect to the database");
    }
    return conn;
  }
}
