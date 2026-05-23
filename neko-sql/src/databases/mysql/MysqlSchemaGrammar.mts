import { SchemaGrammar } from '../../SchemaGrammar.mjs';
import { Column } from '../../Blueprint.mjs';
import { Expression } from '../../Expression.mjs';

export class MysqlSchemaGrammar extends SchemaGrammar {
  compileColumn(column: Column): string {
    const rc = [`${column.columnName}`];

    if (column.properties.type === 'string') {
      rc.push('varchar(' + column.properties.length + ')');
    } else if (column.properties.type === 'char') {
      rc.push('char');
    } else if (column.properties.type === 'boolean') {
      rc.push('boolean');
    } else if (column.properties.type === 'integer') {
      rc.push('integer');
    } else if (column.properties.type === 'text') {
      rc.push('text');
    } else if (column.properties.type === 'timestamp') {
      rc.push('TIMESTAMP');
    } else if (column.properties.type === 'timestampz') {
      rc.push('TIMESTAMP');
    } else if (column.properties.type === 'serial') {
      rc.push('INT AUTO_INCREMENT');
    } else if (column.properties.type === 'float') {
      rc.push('float');
    } else if (column.properties.type === 'double') {
      rc.push('double precision');
    } else if (column.properties.type === 'date') {
      rc.push('date');
    } else if (column.properties.type === 'json') {
      rc.push('json');
    } else if (column.properties.type === 'jsonb') {
      rc.push('jsonb');
    } else if (column.properties.type === 'uuid') {
      rc.push('CHAR(36)');
    } else if (column.properties.type === 'raw') {
      return column.columnName;
    } else {
      throw new Error('Unknown column type: ' + column.properties.type);
    }

    if (column.properties.nullable) {
      rc.push('null');
    } else {
      rc.push('NOT NULL');
    }

    if (column.properties.unique) {
      rc.push('unique');
    }

    if (column.properties.default !== null) {
      rc.push('default ' + this.escape(column.properties.default));
    }

    return rc.join(' ');
  }

  getDefaultUuid(): Expression {
    return new Expression('UUID()');
  }

  getDefaultUuidV7(): Expression {
    // UUID v7: 48-bit ms timestamp | 0111 (ver) | 12-bit random | 10 (var) | 62-bit random
    // Uses UNIX_TIMESTAMP(NOW(3)) for millisecond-precision Unix timestamp.
    return new Expression(
      'LOWER(CONCAT(' +
        "LPAD(HEX((FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) >> 16) & 0xFFFFFFFF), 8, '0'), '-'," +
        "LPAD(HEX(FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000) & 0xFFFF), 4, '0'), '-'," +
        "CONCAT('7', LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
        "CONCAT(ELT(1 + FLOOR(RAND() * 4), '8', '9', 'a', 'b'), LPAD(HEX(FLOOR(RAND() * 0xFFF)), 3, '0')), '-'," +
        "LPAD(HEX(FLOOR(RAND() * 0xFFFFFFFFFFFF)), 12, '0')" +
        '))'
    );
  }
}
