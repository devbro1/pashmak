import { FlexibleFactory } from '@devbro/neko-helper';
import { QueueConnection, QueueTransportInterface } from '.';

export class QueueTransportFactory {
  static instance: FlexibleFactory<QueueConnection<any>> = new FlexibleFactory<
    QueueConnection<any>
  >();

  static register<T>(key: string, factory: (...args: any[]) => T): void {
    QueueTransportFactory.instance.register(key, factory);
  }

  static create<T>(key: string, ...args: any[]): QueueTransportInterface {
    return QueueTransportFactory.instance.create(key, ...args);
  }
}
