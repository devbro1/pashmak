import { describe, expect, test } from 'vitest';
import { HttpServer, BunNotAvailableError, BunConfigurationError } from '../../src';
import { Router } from '@devbro/neko-router';
import { Request, Response } from '@devbro/neko-router';
import * as http2 from 'node:http2';

describe('HTTP/2 and Bun.serve support', () => {
  test('throws BunNotAvailableError when preferBun is true on Node.js', async () => {
    const server = new HttpServer({ preferBun: true });
    await expect(server.listen(0, () => {})).rejects.toThrow(BunNotAvailableError);
  });

  test('throws BunConfigurationError when preferBun and useHttp2 are both true on Bun', async () => {
    // Simulate Bun runtime
    const originalBun = (globalThis as Record<string, unknown>).Bun;
    (globalThis as Record<string, unknown>).Bun = { serve: () => {} };
    try {
      const server = new HttpServer({ preferBun: true, useHttp2: true });
      await expect(server.listen(0, () => {})).rejects.toThrow(BunConfigurationError);
    } finally {
      (globalThis as Record<string, unknown>).Bun = originalBun;
    }
  });

  test('BunNotAvailableError has correct message and name', () => {
    const err = new BunNotAvailableError();
    expect(err.name).toBe('BunNotAvailableError');
    expect(err.message).toContain('Bun runtime is not available');
  });

  test('BunConfigurationError has correct message and name', () => {
    const err = new BunConfigurationError('useHttp2 is not compatible with preferBun.');
    expect(err.name).toBe('BunConfigurationError');
    expect(err.message).toBe('useHttp2 is not compatible with preferBun.');
  });

  test('creates HTTP/2 server with useHttp2 option', async () => {
    const router = new Router();
    router.addRoute(['GET'], '/h2', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('HTTP/2 response');
      res.end();
    });

    const server = new HttpServer({ useHttp2: true });
    server.setRouter(router);

    // Listen on a random available port
    const nodeServer = await server.listen(0, () => {});
    expect(nodeServer).toBeDefined();

    const address = nodeServer.address() as { port: number };
    expect(address.port).toBeGreaterThan(0);

    // Make an HTTP/2 request
    await new Promise<void>((resolve, reject) => {
      const client = http2.connect(`http://localhost:${address.port}`);
      client.on('error', reject);

      const req = client.request({ ':path': '/h2', ':method': 'GET' });
      let data = '';
      req.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        expect(data).toBe('HTTP/2 response');
        client.close();
        resolve();
      });
      req.on('error', reject);
      req.end();
    });

    nodeServer.close();
  });

  test('uses Bun.serve when preferBun is true on Bun runtime', async () => {
    const mockServeResult = { stop: () => {} };
    const mockBun = {
      serve: (options: Record<string, unknown>) => {
        expect(options).toHaveProperty('port');
        expect(options).toHaveProperty('fetch');
        expect(typeof options.fetch).toBe('function');
        return mockServeResult;
      },
    };

    const originalBun = (globalThis as Record<string, unknown>).Bun;
    (globalThis as Record<string, unknown>).Bun = mockBun;
    try {
      const server = new HttpServer({ preferBun: true });
      const result = await server.listen(3000, () => {});
      expect(result).toBe(mockServeResult);
    } finally {
      (globalThis as Record<string, unknown>).Bun = originalBun;
    }
  });

  test('Bun.serve fetch handler returns correct response', async () => {
    let capturedFetch: ((req: globalThis.Request) => Promise<globalThis.Response>) | undefined;

    const mockBun = {
      serve: (options: { fetch: (req: globalThis.Request) => Promise<globalThis.Response> }) => {
        capturedFetch = options.fetch;
        return { stop: () => {} };
      },
    };

    const router = new Router();
    router.addRoute(['GET'], '/bun-test', (req: Request, res: Response) => {
      res.statusCode = 200;
      res.write('Bun response');
      res.end();
    });

    const originalBun = (globalThis as Record<string, unknown>).Bun;
    (globalThis as Record<string, unknown>).Bun = mockBun;
    try {
      const server = new HttpServer({ preferBun: true });
      server.setRouter(router);
      await server.listen(3000, () => {});

      expect(capturedFetch).toBeDefined();

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/bun-test',
        headers: new Map<string, string>(),
        body: null,
        arrayBuffer: async () => new ArrayBuffer(0),
      } as unknown as globalThis.Request;
      const response = await capturedFetch!(mockRequest);

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toBe('Bun response');
    } finally {
      (globalThis as Record<string, unknown>).Bun = originalBun;
    }
  });

  test('Bun.serve includes TLS config when HTTPS certs are set', async () => {
    let capturedOptions: Record<string, unknown> | undefined;

    const mockBun = {
      serve: (options: Record<string, unknown>) => {
        capturedOptions = options;
        return { stop: () => {} };
      },
    };

    const originalBun = (globalThis as Record<string, unknown>).Bun;
    (globalThis as Record<string, unknown>).Bun = mockBun;
    try {
      const server = new HttpServer({ preferBun: true });
      server.enableHttps({ key: 'fake-key', cert: 'fake-cert' });
      await server.listen(3000, () => {});

      expect(capturedOptions?.tls).toEqual({ key: 'fake-key', cert: 'fake-cert' });
    } finally {
      (globalThis as Record<string, unknown>).Bun = originalBun;
    }
  });
});
