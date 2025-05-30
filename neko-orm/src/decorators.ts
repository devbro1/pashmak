type AttributeOptions = {
  primaryKey?: boolean;
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
      target.constructor.prototype.incrementing = false;
    } else {
      if (!target.constructor.prototype.fillable) {
        target.constructor.prototype.fillable = [];
      }
      target.constructor.prototype.fillable.push(propertyKey);
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
