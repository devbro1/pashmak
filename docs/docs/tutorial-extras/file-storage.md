---
sidebar_position: 1
---

# File Storage

Pashmak uses `neko-storage` module to manage files. Currently there is implementation for local file system and AWS-S3.

## Configuration

```javascript
import path from "path";
import os from "os";

export default {
  engine: "local",
  basePath: path.join("../storage", "/main-app-storage/"),
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

you can then access your drivers as wanted:

```javascript
import { storage } from "@root/facade";

storage().get("testfile.txt"); // uses default
storage("temp").get("testfile.txt"); // uses temp file system
storage("qa_s3").get("testfile.txt"); // uses qa_s3 storage, which is a AWS-S3
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
