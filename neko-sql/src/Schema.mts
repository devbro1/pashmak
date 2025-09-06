import { Blueprint } from './Blueprint.mjs';
import { Connection } from './Connection.mjs';
import { SchemaGrammar } from './SchemaGrammar.mjs';

export class Schema {
  constructor(
    private readonly connection: Connection | null,
    private readonly grammar: SchemaGrammar
  ) {}

  async createTable(tableName: string, structMethod: (blueprint: Blueprint) => void) {
    const blueprint = new Blueprint();
    blueprint.setTableName(tableName, false);
    structMethod(blueprint);

    const grammar = new SchemaGrammar();
    const sql = grammar.toSql(blueprint);
    await this.connection?.runQuery({ sql, bindings: [] });
  }

  async alterTable(tableName: string, structMethod: (blueprint: Blueprint) => void) {
    const blueprint = new Blueprint();
    blueprint.setTableName(tableName, true);
    structMethod(blueprint);

    const grammar = new SchemaGrammar();
    const sql = grammar.toSql(blueprint);
    await this.connection?.runQuery({ sql, bindings: [] });
  }

  async dropTable(tableName: string) {
    const grammar = new SchemaGrammar();
    await this.connection?.runQuery(grammar.compileDropTable(tableName));
  }

  async dropTableIfExists(tableName: string) {
    const grammar = new SchemaGrammar();
    await this.connection?.runQuery(grammar.compileDropTableIfExists(tableName));
  }

  async tables() {
    const grammar = new SchemaGrammar();
    return await this.connection?.runQuery(grammar.compileTables());
  }

  async tableExists(table_name: string): Promise<boolean> {
    const grammar = new SchemaGrammar();
    return (await this.connection?.runQuery(grammar.compileTableExists(table_name)))[0]['exists'];
  }
}
