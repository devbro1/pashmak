import { S3ClientConfig } from '@aws-sdk/client-s3';
import { StorageOptions } from '@google-cloud/storage';
import { StorageSharedKeyCredential, AnonymousCredential } from '@azure/storage-blob';

export type Metadata = {
  size: number;
  mimeType: string;
  lastModifiedDate: string;
};

export type GCPStorageConfig = {
  projectId?: string;
  keyFilename?: string;
  credentials?: any;
};

export type AzureStorageConfig = {
  accountName: string;
  accountKey?: string;
  sasToken?: string;
  containerName: string;
};

export type FTPConfig = {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  secure?: boolean;
};

export type SFTPConfig = {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
};

export type StorageConfig = {
  engine: string;
  basePath: string;
  bucket?: string;
  s3Config?: S3ClientConfig;
  gcpConfig?: GCPStorageConfig;
  azureConfig?: AzureStorageConfig;
  ftpConfig?: FTPConfig;
  sftpConfig?: SFTPConfig;
};
