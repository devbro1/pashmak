import { Query } from '@devbro/neko-sql';
import { BaseModel } from './baseModel.mjs';

export abstract class LocalScopeQuery<T extends BaseModel> extends Query {
  protected abstract getModel(): new () => T;

  async getObject() {
    let data = await this.get();

    if (data.length === 0) {
      return undefined;
    }

    data = data[0];
    const obj = new (this.getModel())();
    return obj.newInstance(data, true);
  }

  async getObjects() {
    let rc: T[] = [];
    let data = await this.get();
    const temp_obj = new (this.getModel())();

    rc = data.map((item: any) => {
      return temp_obj.newInstance(item, true);
    });

    return rc;
  }
}
