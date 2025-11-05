---
sidebar_position: 1
---

# Setup Database

To initially setup your database and run migrations you can run migrate commands:
```bash
npm run pdev migrate
```

## Available flags
### migrate rollback --steps=X
to undo last X migrations. if --steps is not given then rollback only last successful migration.

### migrate --refresh
clean up db by undoing all migrations then applying all available migrations

### migrate --fresh
drops then creates databases then migrate all data