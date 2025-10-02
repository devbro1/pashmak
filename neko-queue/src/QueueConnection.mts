import { QueueConnectionInterface, QueueMessageInterface } from './Interfaces.mjs';
import { QueueTransportInterface } from './Interfaces.mjs';

export class QueueConnection<M extends Record<string, QueueMessageInterface>>
  implements QueueConnectionInterface<M>
{
  constructor(private transport: QueueTransportInterface) {}

  async dispatch<C extends keyof M>(channel: C, message: M[C]): Promise<void> {
    let mmsg = await message.getMessage();
    let msg: string = typeof mmsg === 'string' ? mmsg : JSON.stringify(mmsg);
    return await this.transport.dispatch(channel as string, msg);
  }

  listen<C extends keyof M>(channel: C, message_type: { new (...args: any[]): M[C] }) {
    this.transport.registerListener(channel as string, async (message: string) => {
      const msgObj = new message_type();
      await msgObj.setMessage(message);
      if (!(await msgObj.validateMessage())) {
        throw new Error('Invalid message received');
      }
      await msgObj.processMessage();
    });
  }

  async start(): Promise<void> {
    return await this.transport.startListening();
  }

  async stop(): Promise<void> {
    return await this.transport.stopListening();
  }
}
