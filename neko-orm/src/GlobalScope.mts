import type { Query } from '@devbro/neko-sql';
import type { BaseModel } from './baseModel.mjs';

export class GlobalScope {
  apply(query: Query, model: BaseModel): Query {
    return query;
  }
}
