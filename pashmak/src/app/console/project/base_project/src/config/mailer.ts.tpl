export default {
  default: {
    provider: 'memory',
    config: {
      default_from: 'no-reply@devbro.com',
    },
  },
};

export const $prod = {
  default: {
    provider: 'ses',
    // credentials are loaded as env vars
  },
};

export const $test = {
  default: {
    provider: 'memory',
    // credentials are loaded as env vars
  },
};
