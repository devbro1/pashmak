import { AWSS3StorageProviderConfig as AWSS3StorageProviderConfig_base } from '@aws-sdk/client-s3';
import { StorageOptions as GCPStorageProviderConfig_base } from '@google-cloud/storage';

export type Metadata = {
  size: number;
  mimeType: string;
  lastModifiedDate: string;
};

export type AzureBlobStorageProviderConfig = {
  accountName: string;
  accountKey?: string;
  sasToken?: string;
  containerName: string;
};

export type FTPStorageProviderConfig = {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  secure?: boolean;
};

export type SFTPStorageProviderConfig = {
  host: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  passphrase?: string;
};

export type AWSS3StorageProviderConfig = AWSS3StorageProviderConfig_base & { bucket: string };
export type LocalStorageProviderConfig = { basePath: string };
export type GCPStorageProviderConfig = GCPStorageProviderConfig_base & { bucket: string };
