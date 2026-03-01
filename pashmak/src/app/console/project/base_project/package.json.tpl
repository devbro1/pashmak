{
  "name": "Pashmak-App",
  "version": "0.1.0",
  "description": "initial pashmak project",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "type": "module",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "start": "tsx dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "format": "eslint . --fix --ext ts,tsx --report-unused-disable-directives --max-warnings 0 ",
    "prepare": "husky",
    "prettier": "prettier --write .",
    "dev": "tsx --watch -r tsconfig-paths/register src/index.ts start --all | npx pino-pretty",
    "pdev": "tsx -r tsconfig-paths/register src/index.ts",
    "clean": "rm -rf dist"
  },
  "author": "???",
  "license": "MIT",
  "devDependencies": {
    "@swc/core": "^1.12.9",
    "@types/config": "^3.3.5",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/supertest": "^6.0.2",
    "@types/yup": "^0.32.0",
    "supertest": "^6.3.3",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "pino-pretty": "^13.0.0",
    "husky": "^9.1.7",
    "vitest": "^3.2.4"
  },
  "dependencies": {
    "@devbro/pashmak": "0.1.*",
    "bcryptjs": "^3.0.2",
    "clipanion": "^4.0.0-rc.4",
    "jsonwebtoken": "^9.0.0",
    "tsconfig-paths": "^4.2.0",
    {{#if (eq validation_library "yup")}}
    "yup": "^1.6.1",
    {{/if}}
    {{#if (eq validation_library "zod")}}
    "zod": "^4.1.12",
    {{/if}}
    "dotenv": "^16.5.0"
  },
  "directories": {
    "doc": "docs",
    "test": "tests"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/devbro1/pashmak.git"
  },
  "keywords": [
    "pashmak"
  ],
  "bugs": {
    "url": "https://github.com/devbro1/pashmak/issues"
  },
  "homepage": "https://devbro1.github.io/pashmak/",
  "tags": {
    "needsCompile": true,
    "canPublishToNpm": false
  }
}
