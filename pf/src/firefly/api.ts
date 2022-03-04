import axios from 'axios';

const fireflyApi = axios.create({
  baseURL: process.env.FIREFLY_BASE_URL || 'https://firefly.andho.xyz',
  timeout: 3000,
});

const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0OSIsImp0aSI6IjI4NTk2OWJhZTU0M2U5NDc1ZmUzNjIyZmMwY2ZmNjM3YTBmNWU2NzFhODgwNjdhMjkxNjM1YTgwN2Q0YjMyZjY5ZGRiMDBiZjE3NGNiOWVkIiwiaWF0IjoxNjQ1Nzk1NDYwLjUxMDc3NSwibmJmIjoxNjQ1Nzk1NDYwLjUxMDc3OCwiZXhwIjoxNjc3MzMxNDU4Ljg3MjE4NSwic3ViIjoiMSIsInNjb3BlcyI6W119.izt5Qfcqv0EboByA39Pam1DrkOU1EmvMlEKJSEjb0zYzNjILYp3liAF-tKI9aOxKp_P_ouf75vzli-HpD1kFGaVfw1OxNF6ggQmCUjZicPD4_HNN8GZxNkwwz2Wc9A-wGiqvm4W7TpQafR5i5QnRdGBLP2WJMIaR7jhAg5MIOLLqJWMiNGGJeb1C61AzCSeWjbyZDOaTv1DRQcK4jngzGqFzWnd1ufD6qX061z-zccRYIKIwaRjjPcg1ocZSD9zB3jPuyt9PO6iT1Y3eXUx0jbNL8j_wFBKfcCtzUU7lt6b8yXmHK_7ZDdgwRsFqgV4y4sZSdoyM3J-UNYVhRxvkUrDbW3MEgkm17n-x7qMe8bBDqnTZpi-ZC9SshQ3hShx0FMcQ5cKSQTp_ByJ_FGA4gY3Nd8KRfRd8tcvQop1I0hq33CXmZEXxI5gmxdXUFsvhV_E8mZdHPQ7Do59t4GjmvtBnphR6GNsmlbCsPYCR9BoFRFR81nQMtr6VBFJZWO2vP2ziAcdpe3LaRZQW5Z0n3mczd9nHLBRGzoj0jYeEu7J8ef7qwTRF5HAzg0ga56CUAwnQIbbs4yrpH5N8qBZju9Z4icDHoSv5QPM99nWiPZ5W1v4Bd7ux-0aQjAEmkuqfypqeAUm5ppH4mu7rc7XzdUuLObvF99nZP_lFBMro6Es";

fireflyApi.interceptors.request.use(
  (config) => {
    config.headers = { Authorization: 'Bearer ' + (process.env.FIREFLY_PAT || token) };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default fireflyApi;
