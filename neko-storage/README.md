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

local

```ts
import { Storage, StorageFactory } from '@devbro/neko-storage';

const basePath = path.resolve(os.tmpdir(), `test-storage-${randomUUID()}`);
const storage: Storage = StorageFactory.create({ engine: 'local', basePath });
```

AWS S3

```ts
import { Storage, StorageFactory } from '@devbro/neko-storage';

const s3Config : AWSS3Config = ???;
const storage: Storage = StorageFactory.create({ engine: 's3', { s3Config } });
```

More driver available upon request or through PR.
