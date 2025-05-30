import 'reflect-metadata';
import { ctx } from 'neko-helper/src/context';
import { Request } from 'neko-router/src/types';
import { MiddlewareProvider } from '.';

export class BaseController {
  static routes: {
    methods: string[];
    path: string;
    handler: string;
    middlewares: MiddlewareProvider[];
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

function createHttpDecorator(data: {
  methods: string[];
  path: string;
  middlewares: MiddlewareProvider[];
}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: data.methods,
      path: data.path,
      handler: propertyKey,
      middlewares: data.middlewares || [],
    });

    const originalMethod = descriptor.value!;
    const paramKeys = Reflect.getMetadataKeys(target, propertyKey);

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

export function Get(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['GET', 'HEAD'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
  });
}

export function Post(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['POST'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
  });
}

export function Put(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['PUT'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
  });
}

export function Patch(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['PATCH'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
  });
}

export function Delete(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['DELETE'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
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
