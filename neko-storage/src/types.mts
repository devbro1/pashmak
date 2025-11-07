import { S3ClientConfig as S3ClientConfig_base } from '@aws-sdk/client-s3';
import { StorageOptions } from '@google-cloud/storage';

export type Metadata = {
  size: number;
  mimeType: string;
  lastModifiedDate: string;
};

export type GCPStorageConfig = StorageOptions;

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
export type LocalStorageConfig = {
  basePath: string;
};
export type StorageConfig =
  | LocalStorageConfig
  | S3ClientConfig
  | {
      s3Config?: S3ClientConfig;
      gcpConfig?: GCPStorageConfig;
      azureConfig?: AzureStorageConfig;
      ftpConfig?: FTPConfig;
      sftpConfig?: SFTPConfig;
    };
