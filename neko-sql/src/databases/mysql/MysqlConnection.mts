import { connection_events, Connection as ConnectionAbs } from '../../Connection.mjs';
import mysql from 'mysql2/promise';
import { CompiledSql } from '../../types.mjs';
import { Query } from '../../Query.mjs';
import { MysqlQueryGrammar } from './MysqlQueryGrammar.mjs';
import { Schema } from '../../Schema.mjs';
import { MysqlSchemaGrammar } from './MysqlSchemaGrammar.mjs';
import { EventManager } from '@devbro/neko-helper';

export class MysqlConnection extends ConnectionAbs {
  private eventManager = new EventManager();

  on(event: connection_events, listener: (...args: any[]) => void): this {
    this.eventManager.on(event, listener);
    return this;
  }
  off(event: connection_events, listener: (...args: any[]) => void): this {
    this.eventManager.off(event, listener);
    return this;
  }
  emit(event: connection_events, ...args: any[]): Promise<boolean> {
    return this.eventManager.emit(event, ...args);
  }

  connection: mysql.PoolConnection | undefined;
  static pool: mysql.Pool;
  static poolConfig: mysql.PoolOptions;

  static defaults: mysql.PoolOptions = {
    port: 3306,
    connectionLimit: 20,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  };

  constructor(params: mysql.PoolOptions) {
    super();
    if (!MysqlConnection.pool) {
      MysqlConnection.poolConfig = { ...MysqlConnection.defaults, ...params };
      MysqlConnection.pool = mysql.createPool(MysqlConnection.poolConfig);
    }
  }
  async connect(): Promise<boolean> {
    this.eventManager.emit('connect').catch(() => {});
    this.connection = await MysqlConnection.pool.getConnection();
    return true;
  }
  async runQuery(sql: CompiledSql | string): Promise<any> {
    if (typeof sql === 'string') {
      sql = { sql: sql, bindings: [], parts: [sql] };
    }

    this.eventManager.emit('query', { sql: sql.sql, bindings: sql.bindings }).catch(() => {});

    if (!this.isConnected()) {
      await this.connect();
    }
    const [rows] = await this.connection!.query(sql.sql, sql.bindings);
    return rows;
  }

  async runCursor(sql: CompiledSql): Promise<any> {
    // MySQL doesn't have native cursor support like PostgreSQL
    // Return the full result set for now
    return this.runQuery(sql);
  }

  async disconnect(): Promise<boolean> {
    if (this.connection === undefined) {
      return true;
    }
    this.connection.release();
    this.connection = undefined;
    this.eventManager.emit('disconnect').catch(() => {});
    return true;
  }

  getQuery(): Query {
    return new Query(this, new MysqlQueryGrammar());
  }

  getSchema(): Schema {
    return new Schema(this, new MysqlSchemaGrammar());
  }

  getQueryGrammar(): MysqlQueryGrammar {
    return new MysqlQueryGrammar();
  }
  getSchemaGrammar(): MysqlSchemaGrammar {
    return new MysqlSchemaGrammar();
  }

  async beginTransaction(): Promise<void> {
    await this.runQuery({
      sql: 'BEGIN',
      bindings: [],
      parts: ['BEGIN'],
    });
  }

  async commit(): Promise<void> {
    await this.runQuery({ sql: 'COMMIT', bindings: [], parts: ['COMMIT'] });
  }

  async rollback(): Promise<void> {
    await this.runQuery({ sql: 'ROLLBACK', bindings: [], parts: ['ROLLBACK'] });
  }

  static destroy(): Promise<void> {
    return MysqlConnection.pool.end();
  }

  isConnected(): boolean {
    return this.connection !== undefined;
  }

  /**
   * Validates and escapes a MySQL identifier (database name, table name, etc.)
   * Uses a whitelist approach to ensure only safe characters are allowed
   */
  private validateAndEscapeIdentifier(name: string): string {
    // MySQL identifiers can contain: letters, digits, underscores, and dollar signs
    // They must start with a letter, underscore, or digit (in MySQL 5.7.8+)
    const validIdentifierPattern = /^[a-zA-Z0-9_$]+$/;

    if (!validIdentifierPattern.test(name)) {
      throw new Error(
        `Invalid identifier: "${name}". Identifiers must contain only letters, digits, underscores, and dollar signs.`
      );
    }

    // MySQL reserved keywords that should be quoted
    const reservedKeywords = new Set([
      'database',
      'table',
      'user',
      'order',
      'group',
      'select',
      'insert',
      'update',
      'delete',
      'from',
      'where',
      'index',
      'key',
    ]);

    // Quote the identifier with backticks if it's a reserved keyword
    if (reservedKeywords.has(name.toLowerCase())) {
      // Escape any backticks in the name
      const escapedName = name.replace(/`/g, '``');
      return `\`${escapedName}\``;
    }

    return name;
  }

  async createDatabase(name: string): Promise<void> {
    if (this.isConnected()) {
      throw new Error('Cannot create database while connected.');
    }

    const tempConn = await mysql.createConnection({
      host: MysqlConnection.poolConfig.host,
      user: MysqlConnection.poolConfig.user,
      password: MysqlConnection.poolConfig.password,
      port: MysqlConnection.poolConfig.port,
    });
    const safeName = this.validateAndEscapeIdentifier(name);
    await tempConn.query(`CREATE DATABASE ${safeName}`);
    await tempConn.end();
  }

  async dropDatabase(name: string): Promise<void> {
    if (this.isConnected()) {
      throw new Error('Cannot drop database while connected.');
    }

    const tempConn = await mysql.createConnection({
      host: MysqlConnection.poolConfig.host,
      user: MysqlConnection.poolConfig.user,
      password: MysqlConnection.poolConfig.password,
      port: MysqlConnection.poolConfig.port,
    });
    const safeName = this.validateAndEscapeIdentifier(name);
    await tempConn.query(`DROP DATABASE ${safeName}`);
    await tempConn.end();
  }

  async listDatabases(): Promise<string[]> {
    if (!this.isConnected()) {
      await this.connect();
    }
    const [rows] = await this.connection!.query<mysql.RowDataPacket[]>('SHOW DATABASES');
    return rows.map((row: any) => row.Database);
  }

  async existsDatabase(name: string): Promise<boolean> {
    if (!this.isConnected()) {
      await this.connect();
    }
    const [rows] = await this.connection!.query<mysql.RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [name]
    );
    return rows.length > 0;
  }
}
