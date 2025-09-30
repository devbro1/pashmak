export default {
  databases: {
    default: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME || 'test_db',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
      name: 'db',
    },
  },
};
