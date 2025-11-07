import { Client as FTPClient } from 'basic-ftp';
import { Metadata, FTPConfig } from '../types.mjs';
import { StorageProviderInterface } from '../StorageProviderInterface.mjs';
import { ReadStream } from 'fs';
import Stream, { Readable, PassThrough } from 'stream';
import * as mime from 'mime-types';

export class FTPStorageProvider implements StorageProviderInterface {
  constructor(private config: FTPConfig) {}

  private async getClient(): Promise<FTPClient> {
    const client = new FTPClient();
    await client.access({
      host: this.config.host,
      port: this.config.port || 21,
      user: this.config.user || 'anonymous',
      password: this.config.password || '',
      secure: this.config.secure || false,
    });
    return client;
  }

  private getFullPath(path: string): string {
    return path;
  }

  async exists(path: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      await client.size(fullPath);
      return true;
    } catch (error) {
      return false;
    } finally {
      client.close();
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);

      let stream: Stream;
      if (typeof content === 'string' || content instanceof Buffer) {
        const readable = new Readable();
        readable.push(typeof content === 'string' ? Buffer.from(content) : content);
        readable.push(null);
        stream = readable;
      } else if (typeof content === 'object' && !(content instanceof Stream)) {
        const readable = new Readable();
        readable.push(Buffer.from(JSON.stringify(content)));
        readable.push(null);
        stream = readable;
      } else if (content instanceof Stream) {
        stream = content;
      } else {
        throw new Error('Unsupported content type');
      }

      await client.uploadFrom(stream as Readable, fullPath);
      return true;
    } finally {
      client.close();
    }
  }

  async getJson(path: string): Promise<object> {
    const data = await this.getString(path);
    return JSON.parse(data);
  }

  async getString(path: string): Promise<string> {
    const buffer = await this.getBuffer(path);
    return buffer.toString('utf-8');
  }

  async getBuffer(path: string): Promise<Buffer> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      const chunks: Buffer[] = [];
      const writable = new PassThrough();

      writable.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      await client.downloadTo(writable, fullPath);

      return Buffer.concat(chunks);
    } finally {
      client.close();
    }
  }

  async getStream(path: string): Promise<ReadStream> {
    const client = await this.getClient();
    const fullPath = this.getFullPath(path);
    const passThrough = new PassThrough();

    // Download to stream and close client when done
    client
      .downloadTo(passThrough, fullPath)
      .then(() => client.close())
      .catch((error) => {
        client.close();
        passThrough.destroy(error);
      });

    // Ensure client is closed when stream is destroyed
    passThrough.on('close', () => {
      try {
        client.close();
      } catch {
        // Ignore errors if already closed
      }
    });

    return passThrough as unknown as ReadStream;
  }

  async delete(path: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      await client.remove(fullPath);
      return true;
    } finally {
      client.close();
    }
  }

  async metadata(path: string): Promise<Metadata> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      const size = await client.size(fullPath);
      const lastMod = await client.lastMod(fullPath);

      return {
        size: size,
        mimeType: mime.lookup(path) || 'unknown',
        lastModifiedDate: lastMod?.toISOString() || new Date(0).toISOString(),
      };
    } finally {
      client.close();
    }
  }
}
