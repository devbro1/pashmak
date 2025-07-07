# @devbro/neko-orm

ORM meant for those that want quick, simple, and effective models. This is based on @devbro/neko-sql.

```ts
import { BaseModel, Attribute } from '@devbro/neko-orm';

export class Country extends BaseModel {
  protected tableName: string = 'countries';
  protected hasTimestamps: boolean = true;

  @Attribute({ primaryKey: true, incrementingPrimaryKey: true })
  declare id: number | undefined;

  @Attribute()
  declare name: string;

  @Attribute()
  declare region_id: number | undefined;

  regions() {
    return RelationshipFactory.createBelongsTo<Country, Region>({
      source: this,
      targetModel: Region,
    });
  }

  states() {
    return RelationshipFactory.createHasMany<Country, State>({
      source: this,
      targetModel: State,
    });
  }
}

let country = new Country();
country.name = 'Canada';
await country.save();

let canada = await Country.find(3);
let provinces: State[] = await canada.states().get();
```

## supported features

- deep implementation with @devbro/neko-sql to support transactions
- relationship managers for 1to1, 1toM, Mto1, MtoM
- polymorphic relationship

## more details

Please check details from:
https://devbro1.github.io/pashmak/docs/database
