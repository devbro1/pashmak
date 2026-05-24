import { ctxSafe } from "@devbro/pashmak/context";

export default {
  default: {
    level: "info",
    extrasFunction: (message: any) => {
      const requestId = ctxSafe()?.get("requestId");
      if (requestId) {
        message.requestId = requestId;
      }
      return message;
    },
  },
};

export const $test = {
  default: {
    level: "silent",
    extrasFunction: (message: any) => {
      const requestId = ctxSafe()?.get("requestId");
      if (requestId) {
        message.requestId = requestId;
      }
      return message;
    },
  },
};
