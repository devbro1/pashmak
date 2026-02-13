import { ctxSafe } from "@devbro/pashmak/context";
import { LogMessage } from "@devbro/pashmak/logger";

export default {
  level: "info",
  extrasFunction: (message: LogMessage) => {
    let requestId = ctxSafe()?.get("requestId");
    requestId && (message.requestId = requestId);
    return message;
  },
};

export const $test = {
  level: "silent",
}