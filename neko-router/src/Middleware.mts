import { Request, Response } from './types.mjs';

export abstract class Middleware {
  protected constructor(params: any = {}) {}
  static getInstance(params: any): Middleware {
    throw new Error('Method not implemented. Please implement a static getInstance method.');
  }

  abstract call(req: Request, res: Response, next: () => Promise<void>): Promise<void>;
}
