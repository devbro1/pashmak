import { LocalStorage } from '../src/';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';
import * as os from 'os';
import { sleep } from 'neko-helper';

describe('LocalStorage', () => {
  const basePath = path.resolve(os.tmpdir(), `test-storage-${randomUUID()}`);
  let storage: LocalStorage;

  beforeEach(async () => {
    storage = new LocalStorage({ engine: 'local', basePath });
    await sleep(1000);
  });

  afterAll(async () => {
    await fs.rm(basePath, { recursive: true, force: true });
  });

  test('should create a file and check its existence', async () => {
    const filePath = 'test-file1.txt';
    const content = 'Hello, LocalStorage!';
    await storage.put(filePath, content);

    const exists = await storage.exists(filePath);
    expect(exists).toBe(true);
  });

  test('should read a file as a string', async () => {
    const filePath = 'test-file2.txt';
    const content = 'Hello, LocalStorage!';
    await storage.put(filePath, content);

    const result = await storage.getString(filePath);
    expect(result).toBe(content);
  });

  test('should read a file as JSON', async () => {
    const filePath = 'test-file3.json';
    const content = { message: 'Hello, LocalStorage!' };
    await storage.put(filePath, content);

    const result = await storage.getJson(filePath);
    expect(result).toEqual(content);
  });

  test('should delete a file', async () => {
    const filePath = 'test-file4.txt';
    const content = 'Hello, LocalStorage!';
    await storage.put(filePath, content);

    const deleted = await storage.delete(filePath);
    expect(deleted).toBe(true);

    const exists = await storage.exists(filePath);
    expect(exists).toBe(false);
  });
});
