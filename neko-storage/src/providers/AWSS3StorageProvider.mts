import type * as AwsS3 from '@aws-sdk/client-s3';
import type { ReadStream } from 'fs';
import Stream, { type Readable } from 'stream';
import { loadPackage } from '../helper.mjs';
import type { StorageProviderInterface } from '../StorageProviderInterface.mjs';
import type { AWSS3StorageProviderConfig, Metadata } from '../types.mjs';

export class AWSS3StorageProvider implements StorageProviderInterface {
  private s3!: AwsS3.S3Client;
  private static awsS3Module: typeof AwsS3;

  constructor(protected config: AWSS3StorageProviderConfig) {
    if (!AWSS3StorageProvider.awsS3Module) {
      AWSS3StorageProvider.awsS3Module = loadPackage('@aws-sdk/client-s3');
    }
    this.s3 = new AWSS3StorageProvider.awsS3Module.S3Client(this.config);
  }

  async exists(path: string): Promise<boolean> {
    const { HeadObjectCommand } = AWSS3StorageProvider.awsS3Module;
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.config.bucket, Key: path }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const { PutObjectCommand } = AWSS3StorageProvider.awsS3Module;
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
    const { GetObjectCommand } = AWSS3StorageProvider.awsS3Module;
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    const body = await this.streamToString(data.Body as Stream);
    return JSON.parse(body);
  }

  async getString(path: string): Promise<string> {
    const { GetObjectCommand } = AWSS3StorageProvider.awsS3Module;
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    return await this.streamToString(data.Body as Stream);
  }

  async delete(path: string): Promise<boolean> {
    const { DeleteObjectCommand } = AWSS3StorageProvider.awsS3Module;
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
    const { GetObjectCommand } = AWSS3StorageProvider.awsS3Module;
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
    const { GetObjectCommand } = AWSS3StorageProvider.awsS3Module;
    const data = await this.s3.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: path })
    );
    return data.Body as unknown as ReadStream;
  }

  async metadata(path: string): Promise<Metadata> {
    const { HeadObjectCommand } = AWSS3StorageProvider.awsS3Module;
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
