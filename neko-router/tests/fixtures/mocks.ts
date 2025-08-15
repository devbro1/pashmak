import { IncomingMessage, ServerResponse } from 'http';
import { vi } from 'vitest';

export function createMockResponse(): ServerResponse<IncomingMessage> & { body: string } {
  class MyMock {
    statusCode = 200;
    statusMessage = 'OK';
    body = '';
    setHeader = vi.fn();
    getHeader = vi.fn();
    writeHead = vi.fn().mockReturnThis();
    write = vi.fn((chunk: any) => {
      this.body += chunk.toString();
      return true;
    });
    end = vi.fn((chunk?: any) => {
      if (chunk) this.body += chunk.toString();
      return this;
    });
  }

  return new MyMock() as unknown as ServerResponse<IncomingMessage> & { body: string };
}
