import { Middleware } from './Middleware';
import { LexerToken, Request, Response } from './types';

export class MiddlewareFactory {
  public static create(func: Function): Middleware {
    const cls = class extends Middleware {
      call(req: Request, res: Response, next: () => Promise<void>): Promise<void> {
        return func(req, res, next);
      }
      constructor(params: any = {}) {
        super(params);
      }
    };

    return new cls();
  }
}
