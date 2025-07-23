import { ControllerDecoratorOptions, HttpMethod, MiddlewareProvider } from './types';
import { Middleware } from './Middleware';

export class BaseController {
  declare static routes: {
    methods: HttpMethod[];
    path: string;
    handler: string;
    middlewares: MiddlewareProvider[];
  }[];
  static basePath: string = '';
  static baseMiddlewares: MiddlewareProvider[];

  static getInstance() {
    return new this();
  }
}

export function Controller(path: string, options: ControllerDecoratorOptions = {}): ClassDecorator {
  return function (target: any) {
    (target as any).routes = (target as any).routes || [];
    (target as any).basePath = path;
    (target as any).baseMiddlewares = options.middlewares || [];
  };
}

function createHttpDecorator(data: {
  methods: HttpMethod[];
  path: string;
  middlewares: MiddlewareProvider[];
}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const ctor = target.constructor;
    if (!ctor.routes) ctor.routes = [];
    ctor.routes.push({
      methods: data.methods,
      path: data.path,
      handler: propertyKey,
      middlewares: data.middlewares || [],
    });

    const originalMethod = descriptor.value!;
    const paramKeys = Reflect.ownKeys(target.constructor);
    const methodName = propertyKey.toString();

    descriptor.value = async function (...args: any[]) {
      const paramCustomKeys = paramKeys.filter(
        (key) =>
          typeof key === 'string' && key.startsWith(`${methodName}:`) && key.endsWith(':custom')
      );
      for (const paramKey of paramCustomKeys) {
        const paramIndex = parseInt((paramKey as string).split(':')[1]);
        let method = Reflect.get(target.constructor, paramKey.toString());
        if (typeof paramIndex === 'number' && typeof method === 'function') {
          args[paramIndex] = await method();
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

export function Options(
  data: { path?: string; middlewares?: MiddlewareProvider[] } = {}
): MethodDecorator {
  return createHttpDecorator({
    methods: ['OPTIONS'],
    path: data.path || '/',
    middlewares: data.middlewares || [],
  });
}

export function createParamDecorator(func: () => Promise<any> | (() => any)): ParameterDecorator {
  return function MyParamDecorator(
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    Reflect.set(target.constructor, `${propertyKey?.toString()}:${parameterIndex}:custom`, func);
  };
}
