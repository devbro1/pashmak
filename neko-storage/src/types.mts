import { S3ClientConfig as S3ClientConfig_base } from '@aws-sdk/client-s3';
import { StorageOptions as GCPStorageConfig_base } from '@google-cloud/storage';

export type Metadata = {
  size: number;
  mimeType: string;
  lastModifiedDate: string;
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

export type S3ClientConfig = S3ClientConfig_base & { bucket: string };
export type LocalStorageConfig = { basePath: string };
export type GCPStorageConfig = GCPStorageConfig_base & { bucket: string };

export type StorageConfig =
  | LocalStorageConfig
  | S3ClientConfig
  | GCPStorageConfig
  | AzureStorageConfig
  | FTPConfig
  | SFTPConfig;
