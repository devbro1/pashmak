import { queue } from "@devbro/pashmak/facades";

export class {{className}}Queue {
  static channelName = "{{classNameLower}}_channel";

  static listen() {
    return queue().listen({{className}}Queue.channelName, {{className}}Queue.handler);
  }

  static async handler(message: unknown) {
    // TODO: implement queue message handler
    console.log("{{className}}Queue received message:", message);
  }

  static async dispatch(payload: unknown) {
    return queue().dispatch({{className}}Queue.channelName, payload);
  }
}
