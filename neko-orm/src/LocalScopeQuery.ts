import { Query } from '@devbro/neko-sql';
import { BaseModel } from './baseModel';

export abstract class LocalScopeQuery<T extends BaseModel> extends Query {
  protected abstract getModel(): new () => T;

  async getObject() {
    let data = await this.get();

    if (data.length === 0) {
      return undefined;
    }

    data = data[0];
    const obj = new (this.getModel())();
    obj.fill(data);
    return obj;
  }

  async getObjects() {
    let rc: T[] = [];
    let data = await this.get();

    rc = data.map((item: any) => {
      const obj = new (this.getModel())();
      obj.fill(item);
      return obj;
    });

    return rc;
  }
}
