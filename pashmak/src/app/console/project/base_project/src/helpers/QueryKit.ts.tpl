import { logger } from '@devbro/pashmak/facades';
import { JSONValue, Num } from '@devbro/pashmak/helper';
import { Query } from '@devbro/pashmak/sql';
import { cacheQuery } from '@devbro/pashmak/cache';

type orderByDirection = 'asc' | 'desc';
export class QueryKit {
  private query: Query;
  private pagination: { min: number; max: number; sort: '' } = { min: 10, max: 1000, sort: '' };
  private parameters: Record<string, any> = {};
  private sorts: Record<string, CustomSort> = {};
  private filters: Record<string, QueryFilter> = {};
  private defaultSortKey: string = '';
  private _cache_results: boolean = false;

  get cacheResults(): boolean {
    return this._cache_results;
  }

  set cacheResults(value: boolean) {
    this._cache_results = value;
  }

  constructor(query: Query) {
    this.query = query;
  }

  setParameters(parameters: Record<string, any>) {
    this.parameters = parameters;
  }

  addSort(fields: (string | { key: string; field: string })[]) {
    for (const field of fields) {
      if (typeof field === 'string') {
        this.sorts[field] = {
          apply: (query: Query, sort_key: string, direction: orderByDirection) => {
            query.orderBy(sort_key, direction);
          },
        };
        continue;
      }
      if (typeof field === 'object' && field.key && field.field) {
        this.sorts[field.key] = {
          apply: (query: Query, sort_key: string, direction: orderByDirection) => {
            query.orderBy(field.field, direction);
          },
        };
      }
    }
  }

  addCustomSort(
    sort_key: string,
    callback: (query: Query, sort_key: string, direction: orderByDirection) => undefined
  ) {
    this.sorts[sort_key] = {
      apply: callback,
    };
  }

  setDefaultSort(sort_key: string) {
    this.defaultSortKey = sort_key;
  }

  addFilter(filter: QueryFilter) {
    this.filters[filter.getKey()] = filter;
  }

  setPagination(min_pagination: number, max_pagination: number) {
    this.pagination.min = min_pagination;
    this.pagination.max = max_pagination;
  }

  async get() {
    // Apply filters
    for (const key in this.parameters.filter) {
      if (this.filters[key] && this.parameters.filter[key]) {
        this.filters[key].apply(this.query, key, this.parameters.filter[key]);
      }
    }

    let total_rows = await this.query.count();

    // apply sorting
    let sort_key = this.parameters.sort || this.defaultSortKey;
    let sort_direction: orderByDirection = 'asc';
    if (sort_key && sort_key.charAt(0) === '-') {
      sort_key = sort_key.substring(1);
      sort_direction = 'desc';
    }
    if (this.sorts[sort_key]) {
      this.sorts[sort_key].apply(this.query, sort_key, sort_direction);
    }

    // Apply pagination
    let per_page = this?.parameters?.page?.per_page || this.pagination.max;
    per_page = Num.clamp(per_page, this.pagination.min, this.pagination.max);

    this.query.limit(per_page);

    // Apply offset if page is provided
    const page_number: number = this?.parameters?.page?.number || 1;
    const offset = (page_number - 1) * per_page;
    this.query.offset(offset);

    // logger().info({ msg: 'Fetching list', query: this.query.toSql() });

    let rows = [];
    if (this.cacheResults) {
      rows = await cacheQuery(this.query);
    } else {
      rows = await this.query.get();
    }

    return {
      data: rows,
      meta: {
        first_page: 1,
        current_page: page_number,
        last_page: Math.ceil(total_rows / per_page),
        total: total_rows,
        per_page: per_page,
        per_this_page: rows.length,
        from: offset + 1,
        to: Math.min(offset + rows.length, total_rows),
      },
    };
  }
}

interface QueryFilter {
  getKey(): string;
  apply(query: Query, key: String, value: any): undefined;
}

interface CustomSort {
  apply(query: Query, sort_key: string, direction: orderByDirection): undefined;
}

export class QueryFilterFactory {
  static exact(key: string, field: string | undefined = undefined): QueryFilter {
    return {
      getKey() {
        return key;
      },
      apply(query: Query, field_name: string, value: any) {
        query.whereOp(field ?? field_name, '=', value);
      },
    };
  }

  static startsWith(key: string, field: string | undefined = undefined): QueryFilter {
    return {
      getKey() {
        return key;
      },
      apply(query: Query, field_name: string, value: any) {
        query.whereOp(field ?? field_name, 'ILIKE', `${value}%`);
      },
    };
  }

  static custom(field: string, callback: (query: Query, field_name: string, value: any) => Query): QueryFilter {
    return {
      getKey() {
        return field;
      },
      apply(query: Query, field_name: string, value: any) {
        query.whereNested((q) => {
          callback(q, field_name, value);
        });
      },
    };
  }
}
