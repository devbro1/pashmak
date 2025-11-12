# Package Consolidation Report

This report identifies opportunities to consolidate, standardize, and optimize package dependencies across the Pashmak monorepo.

## Executive Summary

- **Removed**: 70+ unused dependencies and devDependencies
- **Removed**: 30+ unused imports from TypeScript files
- **Identified**: Multiple consolidation opportunities for similar packages

## Unused Dependencies Removed

### Dependencies Removed (by package):

1. **neko-context**: esbuild-plugin-file-path-extensions
2. **neko-mailer**: tsconfig-paths
3. **neko-sql**: pg-pool
4. **neko-orm**: date-fns-tz
5. **neko-scheduler**: @types/pluralize, pluralize
6. **neko-queue**: @aws-sdk/client-sqs, amqplib, redis, @types/amqplib
7. **pashmak**: bcryptjs, dotenv, jsonwebtoken, pg-pool, tsconfig-paths
8. **test-app**: bcryptjs, change-case-all, clipanion, handlebars, pg-pool, tsconfig-paths

### DevDependencies Removed (across all packages):

Common removals across multiple packages:
- **pinst** (removed from 10 packages)
- **ts-jest** (removed from 9 packages)
- **ts-node** (removed from 11 packages)
- **@types/express** (removed from 3 packages)
- **@types/supertest** (removed from 3 packages)
- **express** (removed from 2 packages)
- **supertest** (removed from 2 packages)
- Various unused type definitions

## Consolidation Opportunities

### 1. Common DevDependencies

The following packages appear in **10+ workspaces** with the **same version**. These should be considered for:
- Moving to root `package.json` as shared devDependencies (in a monorepo setup)
- Or, ensuring they remain consistent across all packages

#### High Priority (12+ packages):

| Package | Occurrences | Current Version | Recommendation |
|---------|-------------|-----------------|----------------|
| `typescript` | 15 | ^5.3.3 (most), ^5.8.3 (3 packages) | **Standardize on ^5.8.3** |
| `tsup` | 12 | ^8.0.2 | Keep individual (build tool) |
| `prettier` | 12 | ^3.5.3 | Move to root |
| `husky` | 12 | ^9.1.7 | Move to root |
| `eslint` | 12 | 8.57.0 | Move to root |
| `@typescript-eslint/parser` | 12 | ^7.1.1 | Move to root |
| `@typescript-eslint/eslint-plugin` | 12 | ^7.1.1 | Move to root |
| `@types/node` | 12 | ^22.14.1 (most), ^20.11.25 (2 packages) | **Standardize on ^22.14.1** |

#### Medium Priority (6-10 packages):

| Package | Occurrences | Current Version | Recommendation |
|---------|-------------|-----------------|----------------|
| `vitest` | 7 | ^3.2.4 (dep in 1, devDep in 6) | Keep individual (testing) |

### 2. Version Inconsistencies to Resolve

#### Critical - TypeScript Version Mismatch
- **12 packages** use `typescript@^5.3.3`
- **3 packages** use `typescript@^5.8.3` (neko-mailer, pashmak, test-app)
- **Recommendation**: Upgrade all to `^5.8.3` for consistency

#### Critical - @types/node Version Mismatch
- **10 packages** use `@types/node@^22.14.1`
- **2 packages** use `@types/node@^20.11.25` (neko-sql, neko-orm)
- **Recommendation**: Upgrade neko-sql and neko-orm to `^22.14.1`

#### Medium - Testing Tools Version Mismatch
- **supertest**: ^6.3.3 (test-app) vs ^7.1.0 (neko-http)
- **@types/supertest**: ^6.0.2 (test-app) vs ^6.0.3 (neko-http)
- **Recommendation**: Upgrade test-app to match neko-http versions

#### Low - Type Definitions
- **@types/jsonwebtoken**: ^9.0.10 (neko-helper) vs ^9.0.9 (test-app)
- **Recommendation**: Standardize on ^9.0.10

### 3. Similar Purpose Packages - Consider Standardizing

#### Testing Frameworks
Currently using:
- **vitest** (7 packages) - Modern, fast, Vite-powered
- **ts-jest** (previously in 9 packages, now removed)

**Recommendation**: ✅ Already consolidated on vitest. Good choice!

#### Build Tools
Currently using:
- **tsup** (12 packages) - TypeScript Universal Packager

**Recommendation**: ✅ Already standardized. Keep using tsup.

### 4. Internal Package Version Patterns

Internal packages use different versioning patterns:
- Some use `0.1.*` (flexible minor/patch updates)
- Some use `^0.1.*` (flexible minor/patch updates, npm-style)
- Some use `^0.1.2` (specific minimum version)

**Recommendation**: Standardize on `workspace:*` protocol (if using pnpm) or `0.1.*` for monorepo packages to always use local versions.

## Implementation Recommendations

### Phase 1: Quick Wins (Low Risk)
1. ✅ Remove all unused dependencies (COMPLETED)
2. ✅ Remove all unused imports (COMPLETED)
3. Standardize TypeScript version to ^5.8.3 across all packages
4. Standardize @types/node version to ^22.14.1 across all packages

### Phase 2: Consolidation (Medium Risk)
1. Move common devDependencies to root package.json:
   - prettier
   - husky
   - eslint
   - @typescript-eslint/parser
   - @typescript-eslint/eslint-plugin
   
2. Ensure all packages reference root versions

### Phase 3: Advanced (Consider for Future)
1. Evaluate if husky hooks should be at root level only
2. Consider using workspace protocol for internal dependencies
3. Set up dependency version checking in CI/CD

## Benefits of Implementation

1. **Reduced Install Time**: Fewer duplicate packages to download
2. **Reduced Disk Space**: Shared dependencies in node_modules
3. **Easier Maintenance**: Update versions in one place
4. **Consistency**: Same tool versions across all packages
5. **Simpler CI/CD**: Faster installation and builds

## Additional Notes

### Why Some Packages Should Remain Individual

- **tsup**: Build configurations differ per package
- **vitest**: Test configurations differ per package
- **@swc/core**: Used for specific build optimizations

### Packages That Do Similar Things

Currently, there are no redundant packages doing the same job. The monorepo has:
- **One testing framework**: vitest (good!)
- **One build tool**: tsup (good!)
- **One formatter**: prettier (good!)
- **One linter**: eslint (good!)

This is already well-optimized. The main opportunities are in:
1. Removing unused packages (✅ done)
2. Standardizing versions
3. Potentially moving common devDeps to root

## Conclusion

The cleanup removed **70+ unused dependencies** and **30+ unused imports**, significantly reducing the project's dependency footprint. The main remaining opportunity is **version standardization** across packages, particularly for TypeScript and @types/node.
