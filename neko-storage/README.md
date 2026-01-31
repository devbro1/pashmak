# @devbro/neko-storage

A unified, driver-based file storage abstraction library for Node.js and TypeScript. Store and manage files across multiple platforms using a consistent API.

## Installation

```bash
npm install @devbro/neko-storage
```

## Features

- 🔌 **Multiple Storage Providers** - Local, AWS S3, GCP, Azure, FTP, SFTP
- 🎯 **Unified API** - Same interface for all storage providers
- 📦 **Multiple Formats** - Support for JSON, String, Buffer, and Stream
- 🔄 **Easy Migration** - Switch storage providers without changing your code
- 🛡️ **Type-Safe** - Full TypeScript support
- ⚡ **Async/Await** - Modern promise-based API
- 🔍 **Metadata Support** - Get file information (size, mime type, modified date)

## Quick Start

```ts
import { Storage, LocalStorageProvider } from '@devbro/neko-storage';

// Create a storage instance
const provider = new LocalStorageProvider({
  engine: 'local',
  basePath: '/tmp/my-app-storage',
});
const storage = new Storage(provider);

// Store a file
await storage.put('documents/report.txt', 'Hello World');

// Check if file exists
const exists = await storage.exists('documents/report.txt'); // true

// Read the file
const content = await storage.getString('documents/report.txt'); // 'Hello World'

// Delete the file
await storage.delete('documents/report.txt');
```

## Core API

### Storing Files

Store content in various formats:

```ts
// Store string content
await storage.put('path/to/file.txt', 'Hello World');

// Store JSON object
await storage.put('path/to/data.json', { name: 'John', age: 30 });

// Store Buffer
const buffer = Buffer.from('Binary data');
await storage.put('path/to/file.bin', buffer);

// Store from Stream
const stream = fs.createReadStream('/path/to/source.txt');
await storage.put('path/to/destination.txt', stream);
```

> **Note**: If a file already exists at the specified path, it will be overwritten.

### Checking File Existence

```ts
const exists = await storage.exists('path/to/file.txt');
if (exists) {
  console.log('File exists!');
}
```

### Reading Files

Retrieve files in different formats:

```ts
// As JSON object
const data = await storage.getJson<{ name: string }>('config.json');

// As string
const text = await storage.getString('document.txt');

// As Buffer
const buffer = await storage.getBuffer('image.png');

// As Stream (for large files)
const stream = await storage.getStream('video.mp4');
stream.pipe(destination);
```

> **Note**: All read methods throw an error if the file doesn't exist.

### File Metadata

Get information about stored files:

```ts
const metadata = await storage.metadata('path/to/file.txt');
console.log(metadata);
/* Output:
{
  size: 12345,                    // File size in bytes
  mimeType: 'text/plain',         // MIME type
  lastModifiedDate: '2026-01-31'  // Last modified date
}
*/
```

> **Note**: Available metadata fields may vary depending on the storage provider.

### Deleting Files

```ts
const deleted = await storage.delete('path/to/file.txt');
console.log(deleted); // true if deleted, false if file didn't exist
```

## Storage Providers

### Local File System

Store files on the local disk.

```ts
import { LocalStorageProvider, Storage } from '@devbro/neko-storage';
import path from 'path';
import os from 'os';

const provider = new LocalStorageProvider({
  engine: 'local',
  basePath: path.join(os.tmpdir(), 'my-app-storage'),
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'local'`
- `basePath`: Absolute path to the storage directory

**Best for:** Development, testing, single-server deployments

---

### AWS S3

Store files in Amazon S3 buckets.

```ts
import { AWSS3StorageProvider, Storage } from '@devbro/neko-storage';

const provider = new AWSS3StorageProvider({
  engine: 's3',
  bucket: 'my-app-uploads',
  s3Config: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'s3'`
- `bucket`: S3 bucket name
- `s3Config`: AWS SDK configuration object
  - `region`: AWS region
  - `credentials`: Access credentials

**Best for:** Scalable cloud storage, CDN integration, high availability

---

### Google Cloud Storage (GCP)

Store files in Google Cloud Storage buckets.

```ts
import { GCPStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new GCPStorageProvider({
  engine: 'gcp',
  bucket: 'my-app-uploads',
  gcpConfig: {
    projectId: 'my-project-id',
    keyFilename: '/path/to/service-account-key.json',
    // Alternative: Use credentials object
    // credentials: require('./service-account-key.json'),
  },
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'gcp'`
- `bucket`: GCS bucket name
- `gcpConfig`: Google Cloud configuration
  - `projectId`: GCP project ID
  - `keyFilename`: Path to service account JSON key file
  - `credentials`: Or provide credentials object directly

**Best for:** Google Cloud Platform ecosystem, global distribution

---

### Azure Blob Storage

Store files in Microsoft Azure Blob Storage containers.

```ts
import { AzureBlobStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new AzureBlobStorageProvider({
  engine: 'azure',
  azureConfig: {
    accountName: 'mystorageaccount',
    accountKey: process.env.AZURE_STORAGE_KEY,
    // Alternative: Use SAS token
    // sasToken: process.env.AZURE_SAS_TOKEN,
    containerName: 'uploads',
  },
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'azure'`
- `azureConfig`: Azure storage configuration
  - `accountName`: Azure storage account name
  - `accountKey`: Account access key (or use `sasToken`)
  - `containerName`: Blob container name

**Best for:** Microsoft Azure ecosystem, enterprise applications

---

### FTP

Store files on FTP servers.

```ts
import { FTPStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new FTPStorageProvider({
  engine: 'ftp',
  basePath: '/uploads',
  FTPStorageProviderConfig: {
    host: 'ftp.example.com',
    port: 21,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: false, // Set to true for FTPS (FTP over SSL/TLS)
  },
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'ftp'`
- `basePath`: Remote directory path
- `FTPStorageProviderConfig`: FTP connection settings
  - `host`: FTP server hostname
  - `port`: FTP port (default: 21)
  - `user`: Username
  - `password`: Password
  - `secure`: Enable FTPS (default: false)

**Best for:** Legacy systems, shared hosting environments

---

### SFTP

Store files on SFTP servers via SSH.

```ts
import { SFTPStorageProvider, Storage } from '@devbro/neko-storage';
import fs from 'fs';

const provider = new SFTPStorageProvider({
  engine: 'sftp',
  basePath: '/home/user/uploads',
  SFTPStorageProviderConfig: {
    host: 'sftp.example.com',
    port: 22,
    username: process.env.SFTP_USER,
    // Password authentication
    password: process.env.SFTP_PASSWORD,
    // Or use SSH key authentication
    // privateKey: fs.readFileSync('/path/to/private-key'),
    // passphrase: 'key-passphrase', // if key is encrypted
  },
});
const storage = new Storage(provider);
```

**Configuration:**

- `engine`: `'sftp'`
- `basePath`: Remote directory path
- `SFTPStorageProviderConfig`: SSH/SFTP connection settings
  - `host`: SFTP server hostname
  - `port`: SSH port (default: 22)
  - `username`: Username
  - `password`: Password (or use `privateKey`)
  - `privateKey`: SSH private key (Buffer or string)
  - `passphrase`: Private key passphrase (if encrypted)

**Best for:** Secure file transfers, SSH-enabled servers

## Advanced Usage

### Environment-Based Provider Selection

Switch storage providers based on environment:

```ts
import { Storage, LocalStorageProvider, AWSS3StorageProvider } from '@devbro/neko-storage';

function createStorage(): Storage {
  if (process.env.NODE_ENV === 'production') {
    // Use S3 in production
    return new Storage(
      new AWSS3StorageProvider({
        engine: 's3',
        bucket: process.env.S3_BUCKET,
        s3Config: {
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        },
      })
    );
  } else {
    // Use local storage in development
    return new Storage(
      new LocalStorageProvider({
        engine: 'local',
        basePath: './storage',
      })
    );
  }
}

export const storage = createStorage();
```

### Handling Large Files with Streams

For large files, use streams to avoid memory issues:

```ts
import fs from 'fs';

// Upload large file
const uploadStream = fs.createReadStream('./large-video.mp4');
await storage.put('videos/upload.mp4', uploadStream);

// Download large file
const downloadStream = await storage.getStream('videos/upload.mp4');
const writeStream = fs.createWriteStream('./downloaded-video.mp4');
downloadStream.pipe(writeStream);

await new Promise((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
});
```

### Error Handling

```ts
try {
  const content = await storage.getString('path/to/file.txt');
  console.log(content);
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('File not found');
  } else {
    console.error('Error reading file:', error.message);
  }
}
```

## Best Practices

1. **Use Environment Variables** - Store credentials in environment variables, never in code
2. **Check Existence** - Use `exists()` before reading if the file might not exist
3. **Use Streams for Large Files** - Avoid loading large files into memory
4. **Handle Errors** - Always wrap storage operations in try-catch blocks
5. **Path Consistency** - Use forward slashes `/` in paths for all providers
6. **Provider Abstraction** - Design your app to work with any provider

## TypeScript Support

Full TypeScript definitions are included:

```ts
import { Storage, StorageProvider, FileMetadata } from '@devbro/neko-storage';

// Type-safe metadata
const metadata: FileMetadata = await storage.metadata('file.txt');

// Generic type support for JSON
interface UserConfig {
  theme: string;
  language: string;
}

const config = await storage.getJson<UserConfig>('config.json');
console.log(config.theme); // Type-safe!
```

## Contributing

We welcome contributions! If you need a storage provider that's not listed:

1. Open an issue to discuss the provider
2. Submit a pull request with implementation
3. Ensure tests are included

Popular providers we'd love to see:

- DigitalOcean Spaces
- Cloudflare R2
- MinIO
- WebDAV

## License

MIT

## Related Packages

- [@devbro/neko-cache](https://www.npmjs.com/package/@devbro/neko-cache) - Caching solution
- [@devbro/neko-config](https://www.npmjs.com/package/@devbro/neko-config) - Configuration management
- [@devbro/pashmak](https://www.npmjs.com/package/@devbro/pashmak) - Full-stack TypeScript framework
