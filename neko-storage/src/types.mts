import { S3ClientConfig } from '@aws-sdk/client-s3';

export type Metadata = {
  size: number;
  mimeType: string;
  lastModifiedDate: string;
};

export type StorageConfig = {
  engine: string;
  basePath: string;
  bucket?: string;
  s3Config?: S3ClientConfig;
};
