import { QueueTransportInterface } from '../Interfaces.mjs';

export class RedisTransport implements QueueTransportInterface {
  dispatch(channel: string, message: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  registerListener(channel: string, callback: (message: string) => Promise<void>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  startListening(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  stopListening(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
