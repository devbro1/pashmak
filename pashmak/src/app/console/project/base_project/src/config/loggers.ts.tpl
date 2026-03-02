import { ctxSafe } from '@devbro/pashmak/context';

export default {
  default: {
    level: 'info',
    extrasFunction: (message: any) => {
      let requestId = ctxSafe()?.get('requestId');
      requestId && (message.requestId = requestId);
      return message;
    },
  },
};

export const $test = {
  default: {
    level: 'silent',
    extrasFunction: (message: any) => {
      let requestId = ctxSafe()?.get('requestId');
      requestId && (message.requestId = requestId);
      return message;
    },
  },
};
