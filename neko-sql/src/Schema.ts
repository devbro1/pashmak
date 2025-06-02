import { Blueprint } from './Blueprint';
import { Connection } from './Connection';
import { SchemaGrammar } from './SchemaGrammar';

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

  async dropTable(tableName: string) {
    const grammar = new SchemaGrammar();
    await this.connection?.runQuery(grammar.compileDropTable(tableName));
  }

  async tables() {
    const grammar = new SchemaGrammar();
    return await this.connection?.runQuery(grammar.compileTables());
  }

  async tableExists(table_name: string): Promise<boolean> {
    const grammar = new SchemaGrammar();
    return (await this.connection?.runQuery(grammar.compileTableExists(table_name)))[0]['exists'];
  }

  async dropTableIfExists(tableName: string): Promise<void> {
    if (await this.tableExists(tableName)) {
      await this.dropTable(tableName);
    }

    return;
  }
}
