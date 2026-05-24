import { isClass, isFunction } from '@devbro/neko-helper';
import type {
  QueueConnectionInterface,
  QueueMessageInterface,
  QueueTransportInterface,
} from './Interfaces.mjs';

export class QueueConnection<
  M extends Record<string, QueueMessageInterface>,
> implements QueueConnectionInterface<M> {
  constructor(private transport: QueueTransportInterface) {}

  async dispatch<C extends keyof M>(channel: C, message: M[C] | string): Promise<void> {
    let mmsg = '';
    if (typeof message === 'string') {
      mmsg = message;
    } else if (typeof message.getMessage === 'function') {
      mmsg = await message.getMessage();
    } else if (typeof message.toString === 'function') {
      mmsg = await message.toString();
    } else {
      mmsg = JSON.stringify(message);
    }

    const msg: string = typeof mmsg === 'string' ? mmsg : JSON.stringify(mmsg);
    return await this.transport.dispatch(channel as string, msg);
  }

  listen<C extends keyof M>(
    channel: C,
    message_processor: { new (...args: any[]): M[C] } | Function
  ) {
    if (isClass(message_processor)) {
      this.transport.registerListener(channel as string, async (message: string) => {
        // @ts-expect-error
        const msgObj = new message_processor();
        await msgObj.setMessage(message);
        if (!(await msgObj.validateMessage())) {
          throw new Error('Invalid message received');
        }
        await msgObj.processMessage();
      });
      return;
    }

    if (isFunction(message_processor)) {
      this.transport.registerListener(channel as string, message_processor as () => Promise<void>);
      return;
    }

    throw new Error('Invalid message processor provided for listener');
  }

  async start(): Promise<void> {
    return await this.transport.startListening();
  }

  async stop(): Promise<void> {
    return await this.transport.stopListening();
  }
}
