import { Expression } from './Expression.mjs';
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
    | 'jsonb';
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

// references('id').on('roles').onDelete('cascade').onUpdate('cascade');
export class ForeignKeyConstraint {
  column: string;
  reference_table: { table: string; column: string };
  onUpdateAction: 'cascade' | 'set null' | 'restrict' | 'no action' = 'restrict';
  onDeleteAction: 'cascade' | 'set null' | 'restrict' | 'no action' = 'restrict';

  constructor(column: string) {
    this.column = column;
    this.reference_table = { table: '', column: '' };
  }

  on(table: string) {
    this.reference_table.table = table;
    return this;
  }

  references(column: string) {
    this.reference_table.column = column;
    return this;
  }

  onDelete(action: typeof this.onDeleteAction) {
    this.onDeleteAction = action;
    return this;
  }

  onUpdate(action: typeof this.onUpdateAction) {
    this.onUpdateAction = action;
    return this;
  }
}

export class Blueprint {
  tableName: string = '';
  columns: Column[] = [];
  drop_coumns: string[] = [];
  foreignKeys: ForeignKeyConstraint[] = [];
  existingTable: boolean = false;
  primaryKeys: string[] = [];
  constructor() {}
  setTableName(tableName: string, existingTable: boolean = false) {
    this.tableName = tableName;
    this.existingTable = existingTable;
  }

  boolean(columnName: string) {
    const rc = new Column(columnName, 'boolean');
    this.columns.push(rc);
    return rc;
  }

  char(columnName: string) {
    const rc = new Column(columnName, 'char');
    this.columns.push(rc);
    return rc;
  }

  string(columnName: string, length: number = 255) {
    const rc = new Column(columnName, 'string');
    rc.length(length);
    this.columns.push(rc);
    return rc;
  }

  text(columnName: string) {
    const rc = new Column(columnName, 'text');
    this.columns.push(rc);
    return rc;
  }

  json(columnName: string) {
    const rc = new Column(columnName, 'json');
    this.columns.push(rc);
    return rc;
  }

  jsonb(columnName: string) {
    const rc = new Column(columnName, 'jsonb');
    this.columns.push(rc);
    return rc;
  }

  integer(columnName: string) {
    const rc = new Column(columnName, 'integer');
    this.columns.push(rc);
    return rc;
  }

  float(columnName: string) {
    const rc = new Column(columnName, 'float');
    this.columns.push(rc);
    return rc;
  }

  double(columnName: string) {
    const rc = new Column(columnName, 'double');
    this.columns.push(rc);
    return rc;
  }

  id() {
    const rc = new Column('id', 'serial');
    this.columns.push(rc);
    this.primaryKeys.push('id');
    return rc;
  }

  timestamps() {
    this.columns.push(
      new Column('created_at', 'timestampz').default(new Expression('CURRENT_TIMESTAMP'))
    );
    this.columns.push(
      new Column('updated_at', 'timestampz').default(new Expression('CURRENT_TIMESTAMP'))
    );
  }

  date(columnName: string) {
    const rc = new Column(columnName, 'date');
    this.columns.push(rc);
    return rc;
  }

  timestamp(columnName: string) {
    const rc = new Column(columnName, 'timestamp');
    this.columns.push(rc);
    return rc;
  }

  timestampTz(columnName: string) {
    const rc = new Column(columnName, 'timestampz');
    this.columns.push(rc);
    return rc;
  }

  datetime(columnName: string) {
    return this.timestamp(columnName);
  }

  datetimeTz(columnName: string) {
    return this.timestampTz(columnName);
  }

  primary(keys: string[]) {
    this.primaryKeys = keys;
  }

  foreign(columnName: string) {
    const rc = new ForeignKeyConstraint(columnName);
    this.foreignKeys.push(rc);
    return rc;
  }

  dropColumn(columnName: string) {
    this.drop_coumns.push(columnName);
  }
}
