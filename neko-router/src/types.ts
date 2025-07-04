import { IncomingMessage, ServerResponse } from 'http';
import { Middleware } from './Middleware';

export type Request = IncomingMessage & {
  params: any;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  raw_body?: any;
  files?: any;
  query?: Record<string, string>;
};

export type Response = ServerResponse;

export type LexerToken = {
  type: string;
  value: string;
};

export type HandlerType = (
  req: Request,
  res: Response,
  next?: (() => any) | undefined
) => Promise<any> | any;

export type ControllerDecoratorOptions = {
  middlewares?: MiddlewareProvider[];
};

export type MiddlewareProvider =
  | typeof Middleware
  | Middleware
  | ((request: Request, response: Response, next: () => Promise<void>) => Promise<void>);
