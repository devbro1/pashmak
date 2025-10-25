import { parse, format } from 'date-fns';

export function mutateDbDate(value: string): Date {
  return parse(value, 'yyyy-MM-dd HH:mm:ss.SSS', new Date());
}

export function castDbDate(value: Date): string {
  return format(value, 'yyyy-MM-dd HH:mm:ss.SSS');
}

type AttributeOptions = {
  primaryKey?: boolean;
  incrementingPrimaryKey?: boolean;
  caster?: Function;
  mutator?: Function;
  setter?: Function;
  getter?: Function;
  default?: any;
  guarded?: boolean;
};

export function Attribute(options: AttributeOptions = {}) {
  return function (target: any, propertyKey: string) {
    if (options.primaryKey === true) {
      target._primary_keys = [...(target._primary_keys || []), propertyKey];
      target._incrementing_primary_keys =
        target._incrementing_primary_keys ?? options.incrementingPrimaryKey ?? true;
    }

    Object.defineProperty(target, propertyKey, {
      get: function () {
        return options.getter
          ? options.getter(this, this._attributes[propertyKey])
          : this._attributes[propertyKey];
      },
      set(value: any) {
        this._dirties.add(propertyKey);
        this._attributes[propertyKey] = options.setter ? options.setter(this, value) : value;
      },
      configurable: true,
      enumerable: true,
    });

    Object.defineProperty(target, '_fillable', {
      value: [...(target._fillable || []), propertyKey],
      writable: true,
      configurable: true,
      enumerable: true,
    });

    // set default value
    Object.defineProperty(target, '_default_values', {
      value: { ...(target._default_values || {}), [propertyKey]: options.default || undefined },
      writable: true,
      configurable: true,
      enumerable: true,
    });

    if (options.caster) {
      target._casters = { ...(target._casters || {}), [propertyKey]: options.caster };
    }
    if (options.mutator) {
      target._mutators = { ...(target._mutators || {}), [propertyKey]: options.mutator };
    }

    if (options.guarded === true) {
      target._guarded = [...(target._guarded || []), propertyKey];
    }

    return target;
  };
}
