import { Parameter } from './types.mjs';

export type ColumnPropertiesType = {
  type:
    | 'string'
    | 'integer'
    | 'float'
    | 'double'
    | 'boolean'
    | 'char'
    | 'text'
    | 'date'
    | 'timestamp'
    | 'timestampz'
    | 'serial'
    | 'json'
    | 'jsonb'
    | 'raw'
    | 'uuid';
  length: number;
  nullable: boolean;
  unique: boolean;
  default: Parameter;
};
export class Column {
  columnName: string = '';
  properties: ColumnPropertiesType = {
    type: 'string',
    length: 255,
    nullable: false,
    unique: false,
    default: null,
  };

  constructor(columnName: string, type: ColumnPropertiesType['type']) {
    this.columnName = columnName;
    this.properties.type = type;
  }

  length(length: number) {
    this.properties.length = length;
    return this;
  }

  nullable(nullable: boolean = true) {
    this.properties.nullable = nullable;
    return this;
  }

  unique(unique: boolean = true) {
    this.properties.unique = unique;
    return this;
  }

  default(value: ColumnPropertiesType['default']) {
    this.properties.default = value;
    return this;
  }
}
