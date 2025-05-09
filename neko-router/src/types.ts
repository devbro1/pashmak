import { IncomingMessage, ServerResponse } from 'http';
export type Request = IncomingMessage & {
  params: any;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
};

export type Response = ServerResponse;

export type LexerToken = {
  type: string;
  value: string;
};
