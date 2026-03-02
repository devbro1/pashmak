export default {
  default: {
    provider: 'disabled',
    config: {},
  },
};

export const $prod = {
  default: {
    provider: 'redis',
    config: {
      url: 'redis://redis:6379',
    },
  },
};
