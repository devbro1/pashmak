import { ctxSafe } from "neko-helper/src";
import { LogMessage } from "neko-logger/src";

export default {
  extrasFunction: (message: LogMessage) => {
    let requestId = ctxSafe()?.get("requestId");
    requestId && (message.requestId = requestId);
    return message;
  },
};
