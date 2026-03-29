# GitHub Copilot Instructions for the Pashmak Monorepo

## Project Overview

**Pashmak** is a TypeScript-focused, ESM-first web framework monorepo inspired by Laravel and Rails. It follows CUPID methodology and is designed for rapid development of web applications, RESTful APIs, and microservices.

- **Repository:** https://github.com/devbro1/pashmak
- **Documentation site:** https://devbro1.github.io/pashmak/
- **Package manager:** Yarn (workspaces)

---

## Repository Layout

```
/
├── pashmak/          # @devbro/pashmak — CLI & framework scaffolding
├── neko-cache/       # @devbro/neko-cache — Caching providers
├── neko-config/      # @devbro/neko-config — Configuration management
├── neko-context/     # @devbro/neko-context — Context management
├── neko-helper/      # @devbro/neko-helper — Helper utilities
├── neko-http/        # @devbro/neko-http — HTTP client
├── neko-logger/      # @devbro/neko-logger — Logging utilities
├── neko-mailer/      # @devbro/neko-mailer — Email handling
├── neko-orm/         # @devbro/neko-orm — ORM / model layer
├── neko-queue/       # @devbro/neko-queue — Queue management
├── neko-router/      # @devbro/neko-router — Routing utilities
├── neko-scheduler/   # @devbro/neko-scheduler — Task scheduling
├── neko-sql/         # @devbro/neko-sql — SQL query builder
├── neko-storage/     # @devbro/neko-storage — Storage providers
├── docs/             # Docusaurus documentation site
├── test-app/         # Integration test application
└── scripts/          # Build, test, bump & publish automation scripts
```

Each package has the structure:
```
<package>/
  src/            # TypeScript source (ESM)
  tests/          # vitest test files
  package.json    # Includes 'version' field
  README.md       # Package documentation
```

---

## Mandatory Rules

### Update Documentation with Every Code Change

- When you modify public APIs, features, or behaviour in a package, **update that package's `README.md`**.
- When the change affects user-facing framework behaviour, **update the relevant page under `docs/docs/`**.
- Keep JSDoc comments current — add JSDoc for every new public function or class.

### Bump Package Versions for Source Changes

- When you change source code inside a package's `src/` directory, **increment the patch version** (`x.y.PATCH`) in that package's `package.json`.
- Only bump the specific packages that changed — not every package in the monorepo.
- Skip version bumps for documentation-only or tooling-only changes.

---

## Code Conventions

- **TypeScript only** in `src/` — no `.js` source files.
- **ESM first** — use `import`/`export`. Avoid CommonJS `require`.
- **Linting:** [Biome](https://biomejs.dev/) — single `biome.json` at the repo root covers all packages. Run `yarn format:check` to check or `yarn format` to auto-fix.
- **Testing:** vitest — add or update tests for all changed logic.
- **Dependencies:** keep new dependencies minimal; prefer existing utilities already in the monorepo.

---

## Useful Commands

```bash
yarn build:all          # Build all packages
yarn test:all           # Run all tests
yarn bump               # Bump patch versions for packages with changes
yarn workspace docs dev # Start the documentation dev server
yarn format             # Lint and format all files (biome check --write .)
yarn format:check       # Check linting/formatting without writing (biome check .)
```
