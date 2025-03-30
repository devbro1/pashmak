import pluralize from 'pluralize';

export class BaseModel {
  protected tableName: string = '';
  static fillable: string[] = [];
  static primaryKey: string[] = ['id'];
  public id: number | undefined;
  protected exists: boolean = false;

  constructor(initialData: any = {}) {
    this.tableName = pluralize(this.constructor.name.toLowerCase());
    for (const key of new.target.fillable) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }

    for (const key of new.target.primaryKey) {
      if (typeof initialData[key] !== 'undefined') {
        (this as any)[key] = initialData[key];
      }
    }
  }

  public getTablename(): string {
    return this.tableName;
  }

  public findByPrimaryKey<T extends typeof BaseModel>(
    this: InstanceType<T>,
    keys: { [K in T['primaryKey'][number]]: string | number }
  ): any {
    // implementation logic here
    // @ts-ignore
    console.log(this.constructor.primaryKey);
    return {};
  }
}

export class Region extends BaseModel {
  protected tableName: string = 'regions';
  protected fillable: string[] = ['region_name'];
  protected primaryKey: string[] = ['region_id'];
}

type AttributeOptions = {
  primaryKey?: boolean;
};

function Attribute(options: AttributeOptions = {}) {
  return function (target: any, propertyKey: string) {
    if (options.primaryKey === true) {
      if (target.constructor.primaryKey.length === 1 && target.constructor.primaryKey[0] === 'id') {
        target.constructor.primaryKey = [];
      }
      target.constructor.primaryKey.push(propertyKey);
    } else {
      target.constructor.fillable.push(propertyKey);
    }

    Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: undefined,
    });

    return target;
  };
}

export class Country extends BaseModel {
  protected tableName: string = 'countries';

  @Attribute({ primaryKey: true })
  public country_id: number | undefined;

  @Attribute()
  public country_name: string | undefined;

  @Attribute()
  public region_id: number | undefined;
}
