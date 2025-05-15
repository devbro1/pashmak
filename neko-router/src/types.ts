import { IncomingMessage, ServerResponse } from 'http';
export type Request = IncomingMessage & {
  params: any;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
};

export type Response = ServerResponse;

export type LexerToken = {
  type: string;
  value: string;
};
