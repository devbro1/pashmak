# Pashmak — Claude AI Context

## Repository Overview

This is the **Pashmak** monorepo, a TypeScript-focused, ESM-first web framework inspired by Laravel and Rails. It follows CUPID methodology and is designed for rapid prototyping and building web applications, RESTful APIs, and microservices.

**Repository:** https://github.com/devbro1/pashmak  
**Documentation:** https://devbro1.github.io/pashmak/

---

## Monorepo Structure

This repository is managed with **Yarn workspaces**. All packages live at the repo root:

| Package | Description |
|---|---|
| `pashmak/` | Main CLI and framework scaffolding tool (`@devbro/pashmak`) |
| `neko-cache/` | Caching providers (`@devbro/neko-cache`) |
| `neko-config/` | Configuration management (`@devbro/neko-config`) |
| `neko-context/` | Context management (`@devbro/neko-context`) |
| `neko-helper/` | Helper utilities (`@devbro/neko-helper`) |
| `neko-http/` | HTTP client (`@devbro/neko-http`) |
| `neko-logger/` | Logging utilities (`@devbro/neko-logger`) |
| `neko-mailer/` | Email handling (`@devbro/neko-mailer`) |
| `neko-orm/` | Object-relational mapping (`@devbro/neko-orm`) |
| `neko-queue/` | Queue management (`@devbro/neko-queue`) |
| `neko-router/` | Routing utilities (`@devbro/neko-router`) |
| `neko-scheduler/` | Task scheduling (`@devbro/neko-scheduler`) |
| `neko-sql/` | SQL query builder (`@devbro/neko-sql`) |
| `neko-storage/` | Storage providers (`@devbro/neko-storage`) |
| `docs/` | Docusaurus documentation site |
| `test-app/` | Integration test application |
| `scripts/` | Build, test, bump, and publish scripts |

Each package follows a consistent layout:
```
<package>/
  src/          # TypeScript source
  tests/        # Test files (vitest)
  package.json  # Package manifest (includes version)
  tsconfig.json
  tsup.config.ts
  vitest.config.ts
  README.md     # Package-level documentation
```

---

## Common Commands

```bash
# Build all packages
yarn build:all

# Run all tests
yarn test:all

# Bump patch versions for packages with uncommitted changes
yarn bump

# Prepare packages for local development (uses local workspace references)
yarn prep_for_dev

# Prepare packages for release (uses published npm references)
yarn prep_for_release

# Publish packages to npm
yarn publish_to_npm

# Start the documentation dev server
yarn workspace docs dev
```

---

## Rules for AI Assistants

### 1. Update Documentation with Every Change

Whenever you modify code in any package, **always update the corresponding documentation**:

- Update the package's `README.md` if you add, remove, or change any public API, feature, or behaviour.
- Update the relevant files under `docs/docs/` if the change affects user-facing framework features.
- Keep JSDoc comments in source files up to date with function signatures and behaviour.
- If you add a new public function or class, add JSDoc for it.

### 2. Bump Package Versions

Whenever you change the source code of a package (under its `src/` directory), **bump the package's patch version** in its `package.json`:

- Increment the patch segment (`x.y.PATCH`) of the `version` field.
- Only bump the packages that were actually changed — not the whole monorepo.
- If the CI workflow (`bump_versions.yml`) will handle bumping automatically on pull request, you can skip manual bumping; otherwise do it yourself.
- Do **not** bump versions for documentation-only changes (`docs/`, `README.md` files) or tooling-only changes (`scripts/`).

### 3. TypeScript & Code Style

- All source files must be TypeScript (`.ts`). No plain `.js` in `src/`.
- This is an **ESM-first** project — use `import`/`export`, not `require`/`module.exports`.
- Run the linter before submitting changes: each package has its own ESLint + Prettier config.
- Tests use **vitest** — add or update tests for any changed logic.

### 4. Dependency Management

- Add new dependencies only when truly necessary.
- Each package manages its own `dependencies`/`devDependencies` in its own `package.json`.
- Cross-package dependencies within the monorepo are managed via workspace references.

### 5. Pull Request Checklist

Before finalising a PR, verify:
- [ ] Lint/prettier passes
- [ ] Documentation updated (README and/or `docs/`)
- [ ] Tests added or updated to cover changes
- [ ] JSDoc added for any new public function/class
- [ ] Package version bumped (patch) for any changed package
