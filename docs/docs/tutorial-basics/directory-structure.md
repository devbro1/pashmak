---
sidebar_position: 3
---

# Directory structure

- `src/app/**`: all major files for the software to run
- `src/config/*.ts`: configuration related files
- `src/database/**`: contains all related files for managing database
- `src/database/migrations`: files that will control schema changes
- `src/app/console/**/*.ts`: All cli commands you want to add
- `src/app/controllers/**/*.ts`: controller classes that will be used by http server
- `src/app/models/*.ts`: ORM models
- `src/routes.ts`: all routes
- `src/helpers.ts`: general helper functions
- `src/index.ts`: main entry point of the all
- `src/initialize.ts`: most important file, it loads all files for the framework to use. also used by test classes
- `src/middlewares.ts`: your middlewares
- `src/schedulers.ts`: cron jobs
- `.env`
