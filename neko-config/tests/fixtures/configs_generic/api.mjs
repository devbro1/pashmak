export default {
  api_key: 'default-key',
  base_url: 'https://api.example.com',
};

export const $development = {
  api_key: 'dev-key',
  base_url: 'http://localhost:8080',
};

export const $production = {
  api_key: 'prod-key',
  base_url: 'https://api.production.com',
  rate_limit: 1000,
};
