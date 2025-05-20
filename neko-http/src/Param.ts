import { ctx } from './index';
import { Request } from 'neko-router/src/types';
import 'reflect-metadata';

export function Param(paramName: string) {
  return function MyParamDecorator(
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    Reflect.defineMetadata(`${paramName}:param`, parameterIndex, target, propertyKey!);
  };
}
