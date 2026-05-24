import { Query } from '@devbro/neko-sql';
import type { BaseModel } from './baseModel.mjs';

export abstract class LocalScopeQuery<T extends BaseModel> extends Query {
  protected abstract getModel(): new () => T;

  async getObject() {
    let data = await this.get();

    if (data.length === 0) {
      return undefined;
    }

    data = data[0];
    // @ts-expect-error
    return this.getModel().newInstance(data, true);
  }

  async getObjects() {
    let rc: T[] = [];
    const data = await this.get();
    const temp_obj = this.getModel();

    rc = data.map((item: any) => {
      // @ts-expect-error
      return temp_obj.newInstance(item, true);
    });

    return rc;
  }
}
