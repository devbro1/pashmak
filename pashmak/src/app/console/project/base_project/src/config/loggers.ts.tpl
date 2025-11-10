import { ctxSafe } from '@devbro/pashmak/context';
import { LogMessage } from '@devbro/pashmak/logger';

export default {
  default: {
    level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    extrasFunction: (message: LogMessage) => {
      let requestId = ctxSafe()?.get('requestId');
      requestId && (message.requestId = requestId);
      return message;
    },
  },
};
