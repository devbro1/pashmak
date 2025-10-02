import { describe, expect, test } from 'vitest';
import { MemoryTransport, QueueConnection, QueueMessageInterface } from '../../src';
import { sleep } from '@devbro/neko-helper';

class TestMessage implements QueueMessageInterface {
  static count = 0;
  static processed_messages: string[] = [];

  private message: string = '';
  async getMessage(): Promise<string> {
    return this.message;
  }
  async setMessage(value: string): Promise<void> {
    this.message = value;
  }
  async validateMessage(): Promise<Boolean> {
    return true;
  }
  async processMessage(): Promise<void> {
    TestMessage.count++;
    TestMessage.processed_messages.push(this.message);
  }
}

describe('basic tests', () => {
  test('basic testing', async () => {
    const memory_transport = new MemoryTransport({ interval: 1000 });
    const qc = new QueueConnection(memory_transport);

    let m = new TestMessage();
    await m.setMessage('Hello, World!');

    qc.listen('test_channel', TestMessage);
    qc.start();

    await qc.dispatch('test_channel', m);
    await sleep(3000); // wait for message to be processed
    qc.stop();

    expect(TestMessage.count).toBe(1);
    expect(TestMessage.processed_messages).toContain('Hello, World!');
  });
});
