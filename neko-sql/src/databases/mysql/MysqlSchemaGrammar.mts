import { SchemaGrammar } from '../../SchemaGrammar.mjs';
import { Column } from '../../Blueprint.mjs';

export class MysqlSchemaGrammar extends SchemaGrammar {
  compileColumn(column: Column): string {
    // MySQL uses INT AUTO_INCREMENT instead of serial
    if (column.properties.type === 'serial') {
      const rc = [column.columnName, 'INT', 'AUTO_INCREMENT'];

      // Serial columns are typically not nullable and are primary keys
      // But we still respect the nullable setting if specified
      if (!column.properties.nullable) {
        rc.push('NOT NULL');
      }

      return rc.join(' ');
    }

    // For all other types, use the parent implementation
    return super.compileColumn(column);
  }
}
