import { Query } from '@devbro/neko-sql';
import { BaseModel } from './baseModel';

export class GlobalScope {
  async apply(query: Query, model: BaseModel): Promise<Query> {
    return query;
  }
}
