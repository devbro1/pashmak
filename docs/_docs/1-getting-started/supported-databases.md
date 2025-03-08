---
title: Supported Databases
category: Getting Started
order: 1
---

under the hood, different libraries are used for connecting to each database:

Currently the only supported database is Postgresql, but the library is designed to be easily extended to support other databases.

### Postgresql

```javascript
import { Query } from '@devbro1/sql-generator';

query = new Query({
  client: 'postgresql',
  connection: {
    host: 'my.database-server.com',
    port: 5432,
    database: 'database-name',
    user: 'database-user',
    password: 'secretpassword!!',
  },
});
```

### Mysql

support coming soon

### Sqlite

support coming soon

### Mssql

support coming soon

### Oracle

support coming soon
