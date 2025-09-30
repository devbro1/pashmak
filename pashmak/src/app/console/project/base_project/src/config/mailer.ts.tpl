export default {
  mailer: {
    default: {
      provider: 'MEMORY',
      default_from: 'no-reply@devbro.com',
    },
  },
  $prod: {
    mailer: {
      default: {
        provider: 'SES',
        // credentials are loaded as env vars
      },
    },
  },
  $test: {
    mailer: {
      default: {
        provider: 'MEMORY',
      },
    },
  },
};
