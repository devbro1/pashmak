---
sidebar_position: 4
---

# File Storage

Pashmak uses `neko-storage` module to manage files. This is a unified file storage library that supports multiple storage providers while providing a simple intermeow interface to manage files.

## Configuration

```javascript
// config/storage.ts
import path from "path";
import os from "os";

export default {
  default: {
    provider: "local",
    config: {
      basePath: path.join(os.tmpdir(), "/app-storage/"),
    },
  },
  temp: {
    provider: "local",
    config: {
      basePath: path.join(os.tmpdir(), `temp_dir/${randomUUID()}`),
    },
  },
  qa_s3: {
    provider: "s3",
    config: {
      bucket: "qa-team-bucket",
    },
  },
};
```

You can then access your storage drivers:

```ts
import { storage } from "@devbro/pashmak/facades";

await storage().getString("testfile.txt"); // uses default
await storage("temp").getString("testfile.txt"); // uses temp file system
await storage("qa_s3").getString("testfile.txt"); // uses qa_s3 storage (AWS-S3)
```

## Available Methods

- `storage().exists(path: string): Promise<boolean>`: Check if a file exists in the storage.
- `storage().put(path: string, content: string | object | Stream | Buffer): Promise<void>`: Add or override a file in the storage.
- `storage().metadata(path: string): Promise<object>`: Get metadata of a file.
- `storage().getString(path: string): Promise<string>`: Get file content as a string.
- `storage().getJson(path: string): Promise<object>`: Get file content as a JSON object.
- `storage().getBuffer(path: string): Promise<Buffer>`: Get file content as a Buffer.
- `storage().getStream(path: string): Promise<Stream>`: Get file content as a Stream.
- `storage().delete(path: string): Promise<boolean>`: Delete a file from the storage.

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

depending on the driver you may get different metadata fields.

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

## Available Providers

- `local`: Store files on local file system.
- `s3`: Store files on AWS S3.
- `gcs`: Store files on Google Cloud Storage.
- `azure`: Store files on Azure Blob Storage.
- `ftp`: Store files on FTP and FTPS servers.
- `sftp`: Store files on SFTP servers.

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
