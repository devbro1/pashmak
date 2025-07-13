{
  "name": "test-app",
  "version": "0.1.0",
  "description": "testing application for the entire repo",
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
    "dev": "nodemon --watch src --ext ts,tsx,json --signal SIGTERM --exec \"clear && tsx -r tsconfig-paths/register src/index.ts start --all | npx pino-pretty\"",
    "qdev": "tsx -r tsconfig-paths/register src/index.ts",
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
    "nodemon": "^3.1.10",
    "supertest": "^6.3.3",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  },
  "dependencies": {
    "@devbro/pashmak": "0.1.0",
    "bcryptjs": "^3.0.2",
    "clipanion": "^4.0.0-rc.4",
    "dotenv": "^16.5.0",
    "jsonwebtoken": "^9.0.2",
    "tsconfig-paths": "^4.2.0",
    "yup": "^1.6.1"
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
