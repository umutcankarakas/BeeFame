import axios from 'axios';

// Use relative URL so the browser calls our own Next.js proxy (/api/beespector/...)
// which forwards server-side to the internal beespector container.
export const beespectorApi = axios.create({
  baseURL: `/api/beespector`,
  timeout: 200000,
  headers: {
    'Content-Type': 'application/json',
  },
});

beespectorApi.interceptors.request.use(
  (config) => {
    console.log('Beespector API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Beespector API Request Error:', error);
    return Promise.reject(error);
  }
);

beespectorApi.interceptors.response.use(
  (response) => {
    console.log('Beespector API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Beespector API Response Error:', error);
    return Promise.reject(error);
  }
);
