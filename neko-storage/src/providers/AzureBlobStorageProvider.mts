import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { Metadata, StorageConfig } from '../types.mjs';
import { StorageProviderInterface } from '../StorageProviderInterface.mjs';
import { ReadStream } from 'fs';
import Stream, { Readable } from 'stream';
import * as mime from 'mime-types';

export class AzureBlobStorageProvider implements StorageProviderInterface {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;

  constructor(protected config: StorageConfig) {
    if (!config.azureConfig) {
      throw new Error('Azure config is required for Azure Blob Storage');
    }

    const { accountName, accountKey, sasToken, containerName } = config.azureConfig;
    this.containerName = containerName;

    if (accountKey) {
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else if (sasToken) {
      this.blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net?${sasToken}`
      );
    } else {
      throw new Error('Either accountKey or sasToken is required for Azure Blob Storage');
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      const blobClient = containerClient.getBlobClient(path);
      return await blobClient.exists();
    } catch (error) {
      return false;
    }
  }

  async put(path: string, content: string | object | Stream | Buffer): Promise<boolean> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(path);

    let data: string | Buffer | Stream;
    if (typeof content === 'string' || content instanceof Buffer) {
      data = content;
    } else if (typeof content === 'object' && !(content instanceof Stream)) {
      data = JSON.stringify(content);
    } else if (content instanceof Stream) {
      data = content;
    } else {
      throw new Error('Unsupported content type');
    }

    if (data instanceof Stream) {
      await blockBlobClient.uploadStream(data as Readable);
    } else {
      const buffer = typeof data === 'string' ? Buffer.from(data) : data;
      await blockBlobClient.upload(buffer, buffer.length);
    }

    return true;
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
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(path);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download blob');
    }

    return await this.streamToBuffer(downloadResponse.readableStreamBody);
  }

  async getStream(path: string): Promise<ReadStream> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(path);
    const downloadResponse = await blobClient.download();

    if (!downloadResponse.readableStreamBody) {
      throw new Error('Failed to download blob');
    }

    return downloadResponse.readableStreamBody as unknown as ReadStream;
  }

  async delete(path: string): Promise<boolean> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(path);
    await blobClient.delete();
    return true;
  }

  async metadata(path: string): Promise<Metadata> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobClient = containerClient.getBlobClient(path);
    const properties = await blobClient.getProperties();

    return {
      size: properties.contentLength || 0,
      mimeType: properties.contentType || mime.lookup(path) || 'unknown',
      lastModifiedDate: properties.lastModified?.toISOString() || new Date(0).toISOString(),
    };
  }

  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
