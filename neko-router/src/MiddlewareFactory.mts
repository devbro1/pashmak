import { Middleware } from './Middleware.mjs';
import { HandlerType, LexerToken, Request, Response } from './types.mjs';

export class MiddlewareFactory {
  public static create(func: HandlerType): Middleware {
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
