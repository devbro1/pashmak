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

export function Controller(path: string) {
  return function (target: any) {
    (target as any).routes = (target as any).routes || [];
    (target as any).basePath = path;
  };
}

export function GET(path: string = '/') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: ['GET', 'HEAD'],
      path: path,
      handler: propertyKey,
    });
  };
}

export function POST(path: string = '/') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: ['POST'],
      path: path,
      handler: propertyKey,
    });
  };
}

export function PUT(path: string = '/') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: ['PUT'],
      path: path,
      handler: propertyKey,
    });
  };
}

export function PATCH(path: string = '/') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: ['PATCH'],
      path: path,
      handler: propertyKey,
    });
  };
}

export function DELETE(path: string = '/') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.constructor.routes) {
      target.constructor.routes = [];
    }

    target.constructor.routes.push({
      methods: ['DELETE'],
      path: path,
      handler: propertyKey,
    });
  };
}
