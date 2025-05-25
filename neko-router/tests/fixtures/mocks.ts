import { IncomingMessage, ServerResponse } from 'http';

export function createMockResponse(): jest.Mocked<
  ServerResponse<IncomingMessage> & { body: string }
> {
  class MyMock {
    statusCode = 200;
    statusMessage = 'OK';
    body = '';
    setHeader = jest.fn();
    getHeader = jest.fn();
    writeHead = jest.fn().mockReturnThis();
    write = jest.fn((chunk: any) => {
      this.body += chunk.toString();
      return true;
    });
    end = jest.fn((chunk?: any) => {
      if (chunk) this.body += chunk.toString();
      return this;
    });
  }

  return new MyMock() as unknown as jest.Mocked<ServerResponse<IncomingMessage> & { body: string }>;
}
