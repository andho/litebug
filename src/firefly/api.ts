import axios, { AxiosResponse } from 'axios';
import { Config as FireflyConfig } from '../config';

export const FIREFLY_CONFIG_KEY = 'firefly-config';
const fireflyApi = axios.create({
  baseURL: process.env.FIREFLY_BASE_URL || 'https://firefly.andho.xyz',
  timeout: 10000,
});

fireflyApi.interceptors.request.use(
  (config) => {
    let fireflyConfig;
    try {
      fireflyConfig = JSON.parse(window.localStorage.getItem(FIREFLY_CONFIG_KEY) ?? '') as FireflyConfig;
      if ((!fireflyConfig.fireflyPat && !fireflyConfig.fireflyAccessToken) || !fireflyConfig.fireflyUrl) {
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

    if (fireflyConfig.fireflyAccessToken) {
      config.headers = { Authorization: 'Bearer ' + fireflyConfig.fireflyAccessToken };
    } else {
      config.headers = { Authorization: 'Bearer ' + fireflyConfig.fireflyPat };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export async function fetchListUntilLastPage(initialUrl: string): Promise<any[]> {
  const reducer = async (data: any[], previousResponse: AxiosResponse): Promise<any[]> => {
    if (!previousResponse.data.links.next) {
      return data;
    }

    const response = await fireflyApi.get(previousResponse.data.links.next);
    return reducer(data.concat(response.data.data), response);
  };

  const firstResponse = await fireflyApi.get(initialUrl);
  return reducer(firstResponse.data.data, firstResponse);
}

export default fireflyApi;
