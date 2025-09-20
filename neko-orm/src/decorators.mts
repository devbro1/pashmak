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
  default?: any;
};

export function Attribute(options: AttributeOptions = {}) {
  return function (target: any, propertyKey: string) {
    if (options.primaryKey === true) {
      if (!target.constructor.prototype.primaryKey) {
        target.constructor.prototype.primaryKey = [];
      } else if (
        target.constructor.prototype.primaryKey.length === 1 &&
        target.constructor.prototype.primaryKey[0] === 'id'
      ) {
        target.constructor.prototype.primaryKey = [];
      }
      target.constructor.prototype.primaryKey.push(propertyKey);
      target.constructor.prototype.incrementing = options.incrementingPrimaryKey ?? true;
    } else {
      if (!target.constructor.prototype.fillable) {
        target.constructor.prototype.fillable = [];
      }
      target.constructor.prototype.fillable.push(propertyKey);
    }

    target.constructor.prototype.default_values = target.constructor.prototype.default_values || {};
    target.constructor.prototype.casters = target.constructor.prototype.casters || {};
    target.constructor.prototype.mutators = target.constructor.prototype.mutators || {};

    if (options.caster) {
      target.constructor.prototype.casters[propertyKey] = options.caster;
    }
    if (options.mutator) {
      target.constructor.prototype.mutators[propertyKey] = options.mutator;
    }

    if (options.default) {
      target.constructor.prototype.default_values[propertyKey] = options.default;
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
