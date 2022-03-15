import axios from 'axios';

export const FIREFLY_CONFIG_KEY = 'firefly-config';
const fireflyApi = axios.create({
  baseURL: process.env.FIREFLY_BASE_URL || 'https://firefly.andho.xyz',
  timeout: 10000,
});

fireflyApi.interceptors.request.use(
  (config) => {
    let fireflyConfig;
    try {
      fireflyConfig = JSON.parse(window.localStorage.getItem(FIREFLY_CONFIG_KEY) ?? '');
      if (!fireflyConfig.fireflyPat || !fireflyConfig.fireflyUrl) {
        throw new Error("Invalid Firefly Config");
      }
    } catch (e) {
      const controller = new AbortController();
      controller.abort();
      return {
        ...config,
        signal: controller.signal,
      };
    }

    config.url = '' + new URL(config.url ?? '', fireflyConfig.fireflyUrl);
    config.headers = { Authorization: 'Bearer ' + fireflyConfig.fireflyPat };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default fireflyApi;
