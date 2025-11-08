import { Blueprint } from './Blueprint.mjs';
import { Connection } from './Connection.mjs';
import { SchemaGrammar } from './SchemaGrammar.mjs';

/**
 * Schema builder for creating and managing database tables.
 * Provides methods for table creation, alteration, and inspection.
 */
export class Schema {
  /**
   * Creates a new Schema instance.
   * 
   * @param connection - The database connection to use for schema operations
   * @param grammar - The schema grammar for generating SQL statements
   */
  constructor(
    private readonly connection: Connection | null,
    private readonly grammar: SchemaGrammar
  ) {}

  /**
   * Creates a new table in the database.
   * 
   * @param tableName - The name of the table to create
   * @param structMethod - A callback function that receives a Blueprint to define table structure
   * 
   * @example
   * await schema.createTable('users', (table) => {
   *   table.increments('id');
   *   table.string('name');
   *   table.string('email').unique();
   *   table.timestamps();
   * });
   */
  async createTable(tableName: string, structMethod: (blueprint: Blueprint) => void) {
    const blueprint = new Blueprint();
    blueprint.setTableName(tableName, false);
    structMethod(blueprint);

    const sql = this.grammar.toSql(blueprint);
    await this.connection?.runQuery({ sql, parts: [], bindings: [] });
  }

  /**
   * Modifies an existing table structure.
   * 
   * @param tableName - The name of the table to alter
   * @param structMethod - A callback function that receives a Blueprint to define modifications
   * 
   * @example
   * await schema.alterTable('users', (table) => {
   *   table.string('phone').nullable();
   *   table.dropColumn('old_field');
   * });
   */
  async alterTable(tableName: string, structMethod: (blueprint: Blueprint) => void) {
    const blueprint = new Blueprint();
    blueprint.setTableName(tableName, true);
    structMethod(blueprint);

    const sql = this.grammar.toSql(blueprint);
    await this.connection?.runQuery({ sql, parts: [], bindings: [] });
  }

  /**
   * Drops (deletes) a table from the database.
   * 
   * @param tableName - The name of the table to drop
   * 
   * @example
   * await schema.dropTable('old_users');
   */
  async dropTable(tableName: string) {
    await this.connection?.runQuery(this.grammar.compileDropTable(tableName));
  }

  /**
   * Drops a table from the database if it exists.
   * Safe to call even if the table doesn't exist.
   * 
   * @param tableName - The name of the table to drop
   * 
   * @example
   * await schema.dropTableIfExists('temp_table');
   */
  async dropTableIfExists(tableName: string) {
    await this.connection?.runQuery(this.grammar.compileDropTableIfExists(tableName));
  }

  /**
   * Retrieves a list of all tables in the database.
   * 
   * @returns A promise that resolves to an array of table information
   * 
   * @example
   * const allTables = await schema.tables();
   * console.log(allTables);
   */
  async tables() {
    return await this.connection?.runQuery(this.grammar.compileTables());
  }

  /**
   * Checks if a table exists in the database.
   * 
   * @param table_name - The name of the table to check
   * @returns A promise that resolves to true if the table exists, false otherwise
   * 
   * @example
   * if (await schema.tableExists('users')) {
   *   console.log('Users table exists');
   * }
   */
  async tableExists(table_name: string): Promise<boolean> {
    return (await this.connection?.runQuery(this.grammar.compileTableExists(table_name)))[0]['exists'];
  }
}
