import { QueueConnectionInterface, QueueMessageInterface } from './Interfaces.mjs';
import { QueueTransportInterface } from './Interfaces.mjs';

export class QueueConnection<M extends Record<string, QueueMessageInterface>>
  implements QueueConnectionInterface<M>
{
  listeners = new Map<string, new (...args: any[]) => QueueMessageInterface>();
  listenerInstances = new Map<string, Promise<void>>();

  constructor(private transport: QueueTransportInterface) {}
  async dispatch<C extends keyof M>(channel: C, message: M[C]): Promise<void> {
    let mmsg = await message.getMessage();
    let msg: string = typeof mmsg === 'string' ? mmsg : JSON.stringify(mmsg);
    return this.transport.dispatch(channel as string, msg);
  }

  listen<C extends keyof M>(channel: C, message_type: { new (...args: any[]): M[C] }) {
    this.listeners.set(channel as string, message_type);
  }

  async start(): Promise<void> {
    for (const [channel, message_type] of this.listeners.entries()) {
      this.listenerInstances.set(
        channel,
        this.transport.listen(channel as string, async (message: string) => {
          const msgObj = new message_type();
          await msgObj.setMessage(message);
          if (!(await msgObj.validateMessage())) {
            throw new Error('Invalid message received');
          }
          await msgObj.processMessage();
        })
      );
    }
  }

  async stop(): Promise<void> {
    await this.transport.stopListening();
  }
}
