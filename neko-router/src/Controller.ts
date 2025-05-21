import 'reflect-metadata';
import { ctx } from 'neko-http/src/index';
import { Request } from 'neko-router/src/types';

export class BaseController {
  static routes: {
    methods: string[];
    path: string;
    handler: string;
  }[] = [];
  static basePath: string = '';

  static getInstance() {
    return new this();
  }
}

export function Controller(path: string): ClassDecorator {
  return function (target: any) {
    (target as any).routes = (target as any).routes || [];
    (target as any).basePath = path;
  };
}

function createHttpDecorator(data: { methods: string[]; path: string }): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: data.methods,
      path: data.path,
      handler: propertyKey,
    });

    ////////////////
    const originalMethod = descriptor.value!;
    let paramKeys = Reflect.getMetadataKeys(target, propertyKey);

    descriptor.value = function (...args: any[]) {
      for (const paramKey of paramKeys.filter((key: string) => key.endsWith(':param'))) {
        const paramIndex = Reflect.getMetadata(paramKey, target, propertyKey!);
        if (typeof paramIndex === 'number') {
          args[paramIndex] = ctx().get<Request>('request').params[paramKey.replace(':param', '')];
        }
      }

      return originalMethod.apply(this, args);
    };
  };
}

export function Get(path: string = '/'): MethodDecorator {
  return createHttpDecorator({
    methods: ['GET', 'HEAD'],
    path,
  });
}

export function Post(path: string = '/'): MethodDecorator {
  return createHttpDecorator({
    methods: ['POST'],
    path,
  });
}

export function Put(path: string = '/'): MethodDecorator {
  return createHttpDecorator({
    methods: ['PUT'],
    path,
  });
}

export function Patch(path: string = '/'): MethodDecorator {
  return createHttpDecorator({
    methods: ['PATCH'],
    path,
  });
}

export function Delete(path: string = '/'): MethodDecorator {
  return createHttpDecorator({
    methods: ['DELETE'],
    path,
  });
}

export function Param(paramName: string): ParameterDecorator {
  return function MyParamDecorator(
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    Reflect.defineMetadata(`${paramName}:param`, parameterIndex, target, propertyKey!);
  };
}
