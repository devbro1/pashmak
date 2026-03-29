import { FlexibleFactory } from '@devbro/neko-helper';
import { QueueTransportInterface } from '.';

export class QueueTransportFactory {
  static instance: FlexibleFactory<QueueTransportInterface> =
    new FlexibleFactory<QueueTransportInterface>();

  static register(key: string, factory: (...args: any[]) => QueueTransportInterface): void {
    QueueTransportFactory.instance.register(key, factory);
  }

  static create(key: string, ...args: any[]): QueueTransportInterface {
    return QueueTransportFactory.instance.create(key, ...args);
  }
}
