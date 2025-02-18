import { Connection as ConnectionAbs } from '../../Connection';
import { Connection, PoolClient } from 'pg';
import { Pool } from 'pg';
import { CompiledSql } from '../../types';
export class PostgresqlConnection extends ConnectionAbs {
    connection: PoolClient | undefined;
    static pool: Pool;

    constructor() {
        super();
        if(!PostgresqlConnection.pool) {
        PostgresqlConnection.pool = new Pool({
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl: false,
            max: 20, // set pool max size to 20
            idleTimeoutMillis: 1000, // close idle clients after 1 second
            connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
            maxUses: 7500, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
          });
        }
    }
    async connect(): Promise<boolean> {
        this.connection = await PostgresqlConnection.pool.connect();
        return true;
    }
    async runQuery(sql: CompiledSql) {
        let counter=0;
        let result = await this.connection?.query(sql.sql.replace(/\?/g, () => `$${++counter}`),sql.bindings);

        return result?.rows;
    }
    disconnect(): boolean {
        this.connection?.release();
        return true;
    }
}