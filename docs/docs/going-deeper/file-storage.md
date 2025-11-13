---
sidebar_position: 3
---

# File Storage

Pashmak uses `neko-storage` module to manage files. Currently there is implementation for local file system, AWS-S3, GCP File Storage, Azure Blob Storage, FTP(s), and SFTP(ftp over ssh).

## Configuration

```javascript
import path from "path";
import os from "os";

export default {
  engine: "local",
  basePath: path.join("../storage", "/app-storage/"),
};

export const temp = {
  engine: "local",
  basePath: path.join(os.tmpdir(), `temp_dir/${randomUUID()}`),
}

export const qa_s3 = {
  engine: "s3",
  basePath: '/',
  bucket: 'qa-team-bucket',
  s3Config: { // use a S3ClientConfig to fill this parameter
    ???
  };
}
```

You can then access your storage drivers:

```ts
import { storage } from "@devbro/pashmak/facades";

await storage().getString("testfile.txt"); // uses default
await storage("temp").getString("testfile.txt"); // uses temp file system
await storage("qa_s3").getString("testfile.txt"); // uses qa_s3 storage (AWS-S3)
```

## Managing Files

### exists(path)

to see if a file exists in the storage

```ts
await storage().exists("path/to/test.txt");
```

### put(path, content)

to add a new file or override an existing file.
this method will not throw an error on overriding existing file, make sure you use exists() if case you are worried about existing file.

```ts
await storage().put("test.txt", "hello world");
```

content can be string, object, Stream or Buffer.

```ts
await storage().put("test.txt", "hello world");
await storage().put("test.json", { message: "hello world" });
await storage().put("test.jpg", fs.readFileSync("path/to/file.jpg")); // Buffer
await storage().put("test.jpg", createReadStream("./example.txt")); // ReadStream
```

### metadata(path)

sometime you need details of the file

```ts
await storage().metadata("test.jpg");
```

the return will look like:

```ts
{
    "size": 97511,
    "mimeType": "image/jpeg",
    "lastModifiedDate": "2025-05-25T22:01:27.625Z"
}
```

depending on the driver you may end up with more or less data.

### getString(path), getJson(path), getBuffer(path), getStream(path)

Depending on your need a few different methods are provided to help getting the file content.

```ts
await storage().getString("test.txt"); // string
await storage().getJson("test.json"); // json object
await storage().getBuffer("test.jpg"); // Buffer
await storage().getStream("test.jpg"); // stream

// to send stream as a response
(await storage().getStream("test.jpg")).pipe(res);
```

### delete(path)

to delete an existing file. It will return true on success and false on failure.
if false is returned, it can be either because file did not exists, or delete process failed for some other reason.

```ts
await storage().delete("path/to/file.txt");
```

## Available Providers

#### Local Storage Provider

For Local File storage, or file storage of mounted drives

```ts
import { LocalStorage } from "@devbro/pashmak/storage";

export default {
  storages: {
    default: {
      provider: "local",
      config: {
        basePath: path.join(os.tmpdir(), "/app-storage/"),
      } as LocalStorageConfig,
    },
  },
};
```

#### AWS S3 Provider

For Amazon S3 cloud storage

```ts
import { S3ClientConfig } from "@devbro/pashmak/storage";

export default {
  storages: {
    s3: {
      provider: "s3",
      config: {
        region: "us-east-1",
        credentials: {
          accessKeyId: "YOUR_ACCESS_KEY_ID",
          secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
        },
        bucket: "your-bucket-name",
      } as S3ClientConfig,
    },
  },
};
```

#### GCP File Storage provider

For Google Cloud Storage

```ts
import { GCPStorageConfig } from "@devbro/neko-storage";

export default {
  storages: {
    gcp: {
      provider: "gcp",
      config: {
        projectId: "your-project-id",
        keyFilename: "/path/to/keyfile.json", // or use credentials object
        bucket: "your-bucket-name",
      } as GCPStorageConfig,
    },
  },
};
```

#### Azure Blob Storage provider

For Microsoft Azure Blob Storage

```ts
import { AzureStorageConfig } from "@devbro/neko-storage";

export default {
  storages: {
    azure: {
      provider: "azure",
      config: {
        accountName: "your-storage-account",
        accountKey: "YOUR_ACCOUNT_KEY", // or use sasToken
        // sasToken: 'YOUR_SAS_TOKEN', // alternative to accountKey
        containerName: "your-container-name",
      } as AzureStorageConfig,
    },
  },
};
```

#### FTP provider

For FTP and FTPS (FTP over TLS/SSL) servers

```ts
import { FTPConfig } from "@devbro/neko-storage";

export default {
  storages: {
    ftp: {
      provider: "ftp",
      config: {
        host: "ftp.example.com",
        port: 21, // optional, defaults to 21
        user: "username",
        password: "password",
        secure: false, // set to true for FTPS
      } as FTPConfig,
    },
  },
};
```

#### SFTP Provider

For SFTP storage

```ts
import { SFTPConfig } from "@devbro/neko-storage";

export default {
  storages: {
    sftp: {
      provider: "sftp",
      config: {
        host: "sftp.example.com",
        port: 22, // optional, defaults to 22
        username: "username",
        password: "password", // or use privateKey
        // privateKey: fs.readFileSync('/path/to/private/key'),
        // passphrase: 'key-passphrase', // if private key is encrypted
      } as SFTPConfig,
    },
  },
};
```

## Registering your own Provider

If you ever need to add your own provider follow this sample code:

```ts
import { StorageProviderInterface, Storage, StorageProviderFactory } from "@devbro/neko-storage";

class MyStorageProvider implements StorageProviderInterface {
  ???
}

StorageProviderFactory.register('MyStorageName', (opt) => {
  return new AWSS3StorageProvider(opt);
});
```
