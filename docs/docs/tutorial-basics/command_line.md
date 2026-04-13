---
sidebar_position: 7
---

# Command Line

Pashmak provides a CLI with commands for starting your application and scaffolding new features.

---

## `start`

Starts one or more application services.

```bash
pashmak start [options]
```

At least one option must be provided. If none are given, the CLI will print a usage hint.

### Options

| Option        | Description                                      |
| ------------- | ------------------------------------------------ |
| `--http`      | Start the HTTP server                            |
| `--scheduler` | Start the cron/task scheduler                    |
| `--cron`      | Alias for `--scheduler`                          |
| `--queue`     | Start all configured queue workers               |
| `--all`       | Start all services (HTTP, scheduler, and queues) |

### Examples

```bash
# Start only the HTTP server
pashmak start --http

# Start the HTTP server and queue workers
pashmak start --http --queue

# Start everything
pashmak start --all
```

---

## `create feature`

Scaffolds a new feature folder under `src/app/features/<name>/`.

Aliases: `make feature`

```bash
pashmak create feature [options] [FeatureName]
```

If `FeatureName` is omitted you will be prompted to enter it. If no flags are provided, an interactive checkbox lets you pick which parts to generate.

### Options

| Option           | Description                      |
| ---------------- | -------------------------------- |
| `--all`          | Generate all feature files       |
| `--controller`   | Create a controller              |
| `--service`      | Create a service                 |
| `--repository`   | Create a repository              |
| `--model`        | Create a model                   |
| `--query-scopes` | Create query scopes              |
| `--validations`  | Create controller validations    |
| `--queue`        | Create a queue handler           |
| `--cron`         | Create a cron job                |
| `--migration`    | Create a database migration file |

### Generated files

Depending on the flags used, the following files are created inside `src/app/features/<featureName>/`:

| File                          | Flag             |
| ----------------------------- | ---------------- |
| `index.ts`                    | always           |
| `<Name>Controller.ts`         | `--controller`   |
| `<Name>Service.ts`            | `--service`      |
| `<Name>Repository.ts`         | `--repository`   |
| `<Name>Model.ts`              | `--model`        |
| `<Name>QueryScopes.ts`        | `--query-scopes` |
| `<Name>Validations.ts`        | `--validations`  |
| `<Name>Queue.ts`              | `--queue`        |
| `<Name>Cron.ts`               | `--cron`         |
| `src/database/migrations/...` | `--migration`    |

Post-generation, the command automatically:

- Registers the controller route in `src/routes.ts` (if `--controller`)
- Exports the model in `src/app/models/index.ts` (if `--model`)
- Adds the queue listener (if `--queue`)
- Adds the cron entry to `src/schedules.ts` (if `--cron`)

### Examples

```bash
# Scaffold everything for a new "BlogPost" feature
pashmak create feature --all BlogPost

# Scaffold only a controller and service
pashmak create feature --controller --service Product

# Interactive mode – prompts for name and parts
pashmak create feature

# Use the alias
pashmak make feature --all Order
```
