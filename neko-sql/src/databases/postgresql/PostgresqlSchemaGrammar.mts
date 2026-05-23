import { Column } from '../../Blueprint.mjs';
import { Expression } from '../../Expression.mjs';
import { SchemaGrammar } from '../../SchemaGrammar.mjs';

export class PostgresqlSchemaGrammar extends SchemaGrammar {
  compileColumn(column: Column): string {
    if (column.properties.type === 'uuid') {
      const rc = [`${column.columnName}`, 'uuid'];
      if (column.properties.nullable) {
        rc.push('null');
      } else {
        rc.push('not null');
      }
      if (column.properties.unique) {
        rc.push('unique');
      }
      if (column.properties.default !== null) {
        rc.push('default ' + this.escape(column.properties.default));
      }
      return rc.join(' ');
    }
    return super.compileColumn(column);
  }

  getDefaultUuid(): Expression {
    return new Expression('gen_random_uuid()');
  }
}
