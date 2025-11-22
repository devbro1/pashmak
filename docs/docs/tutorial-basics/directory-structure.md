---
sidebar_position: 3
---

# Directory structure

- `private/*`: contains all private files that are not code. such as uploaded files, pdf template files, etc.
- `public/*`: contains all public files that will be served directly, like images, css, html, and js files
- `src/app/**`: all major files for the software to run
- `src/app/console/**/*.ts`: All cli commands you want to add
- `src/app/controllers/**/*.ts`: controller classes for handling incoming requests
- `src/app/mail/**/*.ts`: all email related files, including all Mailable classes.
- `src/app/models/*.ts`: ORM models
- `src/app/queues/**/*.ts`: all queue related files, including job classes and queue listeners.
- `src/app/scopes/**`: ORM scopes
- `src/app/services/**`: services are meant to contain business logic that needs to be reused in multiple places. for example, user creation logic that is used in both controller and cli command.
- `src/config/*.`: configuration related files
- `src/database/**`: contains all related files for managing database
  - `src/database/migrations`: files that will control schema changes
- `src/routes.ts`: all http routes of the server
- `src/helpers/*`: general helper functions, utilities, and support classes
- `src/index.ts`: main entry point of the application. It will load initialize.ts and run start clipanion.
- `src/initialize.ts`: most important file, it loads all files for the framework to use. also used by test classes to initialize the application before running tests.
- `src/middlewares.ts`: your middlewares
- `src/schedulers.ts`: cron jobs
- `.env`: environment variables file
- `tests/**`: all test files
