# @devbro/neko-storage

a library to abstract file storage and management.

## basic usage

```ts
import { Storage, StorageFactory } from '@devbro/neko-storage';

const storage: Storage = StorageFactory.create(???);

// put a file, if file exists already, it will override it.
content : string | object | Stream | Buffer = ??? ;
let success = await storage.put('path/to/file/filename.ext', content);

// check if the file exists or not
let file_exists = await storage.exists('path/to/file/filename.ext');

// get some details about the file, depending on type of drive metadata may differ
let file_metadata = await storage.metadata('path/to/file/filename.ext');
/*
{
    size: 12345; //bytes
    mimeType: 'application/json';
    lastModifiedDate: 'date string';
}
*/

// get the file in the format you want, if fails it will throw an Error
let file_content_as_Json = await storage.getJson('path/to/file/filename.ext');
let file_content_as_String = await storage.getString('path/to/file/filename.ext');
let file_content_as_Buffer = await storage.getBuffer('path/to/file/filename.ext');
let file_content_as_Stream = await storage.getStream('path/to/file/filename.ext');


// delete a file
let is_file_deleted = await storage.delete('path/to/file/filename.ext');
```

## available drivers

### Local Storage

Store files on the local file system.

```ts
import { LocalStorageProvider, Storage } from '@devbro/neko-storage';

const basePath = path.resolve(os.tmpdir(), `test-storage-${randomUUID()}`);
const provider = new LocalStorageProvider({ engine: 'local', basePath });
const storage = new Storage(provider);
```

### AWS S3

Store files in Amazon S3 buckets.

```ts
import { AWSS3StorageProvider, Storage } from '@devbro/neko-storage';

const provider = new AWSS3StorageProvider({
  engine: 's3',
  bucket: 'your-bucket-name',
  s3Config: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'YOUR_ACCESS_KEY',
      secretAccessKey: 'YOUR_SECRET_KEY',
    },
  },
});
const storage = new Storage(provider);
```

### Google Cloud Storage (GCP)

Store files in Google Cloud Storage buckets.

```ts
import { GCPStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new GCPStorageProvider({
  engine: 'gcp',
  bucket: 'your-bucket-name',
  gcpConfig: {
    projectId: 'your-project-id',
    keyFilename: '/path/to/service-account-key.json',
    // Or use credentials object directly
    // credentials: {...}
  },
});
const storage = new Storage(provider);
```

### Azure Blob Storage

Store files in Azure Blob Storage containers.

```ts
import { AzureBlobStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new AzureBlobStorageProvider({
  engine: 'azure',
  azureConfig: {
    accountName: 'your-storage-account',
    accountKey: 'YOUR_ACCOUNT_KEY', // Or use sasToken instead
    containerName: 'your-container-name',
  },
});
const storage = new Storage(provider);
```

### FTP

Store files on FTP servers.

```ts
import { FTPStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new FTPStorageProvider({
  engine: 'ftp',
  basePath: '/remote/path',
  FTPStorageProviderConfig: {
    host: 'ftp.example.com',
    port: 21,
    user: 'username',
    password: 'password',
    secure: false, // Set to true for FTPS
  },
});
const storage = new Storage(provider);
```

### SFTP

Store files on SFTP servers via SSH.

```ts
import { SFTPStorageProvider, Storage } from '@devbro/neko-storage';

const provider = new SFTPStorageProvider({
  engine: 'sftp',
  basePath: '/remote/path',
  SFTPStorageProviderConfig: {
    host: 'sftp.example.com',
    port: 22,
    username: 'username',
    password: 'password',
    // Or use private key authentication
    // privateKey: fs.readFileSync('/path/to/private-key'),
    // passphrase: 'key-passphrase',
  },
});
const storage = new Storage(provider);
```

More driver available upon request or through PR.
