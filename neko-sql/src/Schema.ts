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
}
