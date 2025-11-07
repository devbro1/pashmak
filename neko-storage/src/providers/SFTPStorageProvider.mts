import SFTPClient from 'ssh2-sftp-client';
import { Metadata, SFTPConfig } from '../types.mjs';
import { StorageProviderInterface } from '../StorageProviderInterface.mjs';
import { ReadStream } from 'fs';
import Stream, { Readable, PassThrough } from 'stream';
import * as mime from 'mime-types';

export class SFTPStorageProvider implements StorageProviderInterface {
  constructor(private config: SFTPConfig) {}

  private async getClient(): Promise<SFTPClient> {
    const client = new SFTPClient();
    await client.connect({
      host: this.config.host,
      port: this.config.port || 22,
      username: this.config.username,
      password: this.config.password,
      privateKey: this.config.privateKey,
      passphrase: this.config.passphrase,
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
      const result = await client.exists(fullPath);
      return result !== false;
    } catch (error) {
      return false;
    } finally {
      await client.end();
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);

      let data: string | Buffer | Readable;
      if (typeof content === 'string') {
        data = content;
      } else if (content instanceof Buffer) {
        data = content;
      } else if (typeof content === 'object' && !(content instanceof Stream)) {
        data = Buffer.from(JSON.stringify(content));
      } else if (content instanceof Stream) {
        data = content as Readable;
      } else {
        throw new Error('Unsupported content type');
      }

      await client.put(data, fullPath);
      return true;
    } finally {
      await client.end();
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
      const buffer = await client.get(fullPath);
      return buffer as Buffer;
    } finally {
      await client.end();
    }
  }

  async getStream(path: string): Promise<ReadStream> {
    const client = await this.getClient();
    const fullPath = this.getFullPath(path);
    const passThrough = new PassThrough();

    // Get the file as a stream and close client when done
    client
      .get(fullPath)
      .then((data) => {
        if (data instanceof Buffer) {
          const readable = new Readable();
          readable.push(data);
          readable.push(null);
          readable.pipe(passThrough);
        } else if (data instanceof Stream) {
          (data as Stream).pipe(passThrough);
        }
        return client.end();
      })
      .catch((error) => {
        client.end().catch(() => {
          // Ignore errors when closing client during error handling
        });
        passThrough.destroy(error);
      });

    // Ensure client is closed when stream is destroyed
    passThrough.on('close', () => {
      client.end().catch(() => {
        // Ignore errors if already closed
      });
    });

    return passThrough as unknown as ReadStream;
  }

  async delete(path: string): Promise<boolean> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      await client.delete(fullPath);
      return true;
    } finally {
      await client.end();
    }
  }

  async metadata(path: string): Promise<Metadata> {
    const client = await this.getClient();
    try {
      const fullPath = this.getFullPath(path);
      const stats = await client.stat(fullPath);

      return {
        size: stats.size || 0,
        mimeType: mime.lookup(path) || 'unknown',
        lastModifiedDate: new Date((stats.modifyTime || 0) * 1000).toISOString(),
      };
    } finally {
      await client.end();
    }
  }
}
