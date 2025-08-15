import { Schema } from './Schema.mjs';

export abstract class Migration {
  abstract up(schema: Schema): Promise<void>;
  abstract down(schema: Schema): Promise<void>;
}
