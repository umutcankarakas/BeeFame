import axios from 'axios';

const beespectorApiHost = process.env.NEXT_PUBLIC_BEESPECTOR_URL || 'http://localhost:8001';

export const beespectorApi = axios.create({
  baseURL: `${beespectorApiHost}/api`,
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
