import { Metadata, StorageConfig } from '../types.mjs';
import { Storage } from '../Storage.mjs';
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectOutput,
} from '@aws-sdk/client-s3';
import { ReadStream } from 'fs';
import Stream, { Readable } from 'stream';
import { StorageProviderInterface } from '../StorageProviderInterface.mjs';

export class AWSS3StorageProvider implements StorageProviderInterface {
  private s3: S3Client;

  constructor(protected config: StorageConfig) {
    this.s3 = new S3Client(this.config?.s3Config || {});
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.config?.bucket, Key: path }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    let body: any;
    if (typeof content === 'string' || content instanceof Buffer) {
      body = content;
    } else if (typeof content === 'object' && !(content instanceof Stream)) {
      body = JSON.stringify(content);
    } else if (content instanceof Stream) {
      body = content;
    } else {
      throw new Error('Unsupported content type');
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: path,
        Body: body,
      })
    );

    return true;
  }

  async getJson(path: string): Promise<object> {
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    const body = await this.streamToString(data.Body as Stream);
    return JSON.parse(body);
  }

  async getString(path: string): Promise<string> {
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    return await this.streamToString(data.Body as Stream);
  }

  async delete(path: string): Promise<boolean> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: path }));
    return true;
  }

  private async streamToString(stream: Stream): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }

  async getBuffer(path: string): Promise<Buffer> {
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    const chunks: Uint8Array[] = [];
    const stream = data.Body as Readable;

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async getStream(path: string): Promise<ReadStream> {
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    return data.Body as unknown as ReadStream;
  }

  async metadata(path: string): Promise<Metadata> {
    const metadata = await this.s3.send(
      new HeadObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    return {
      size: metadata.ContentLength || 0,
      mimeType: metadata.ContentType || 'unknown',
      lastModifiedDate: (metadata.LastModified || new Date(0)).toISOString(),
    };
  }
}
