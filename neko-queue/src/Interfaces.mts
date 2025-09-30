export interface QueueMessageInterface {
  getMessage(): Promise<string>;
  setMessage(value: string): Promise<void>;
  validateMessage(): Promise<Boolean>;
  processMessage(): Promise<void>;
}

export interface QueueConnectionInterface<M extends Record<string, QueueMessageInterface>> {
  dispatch<C extends keyof M>(channel: C, message: M[C]): Promise<void>;
  listen<C extends keyof M>(channel: C, message_type: { new (...args: any[]): M[C] }): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface QueueTransportInterface {
  dispatch(channel: string, message: string): Promise<void>;
  registerListener(channel: string, callback: (message: string) => Promise<void>): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
}
