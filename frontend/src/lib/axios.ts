// src/lib/axios.ts
import axios from 'axios';

// Use relative URL so the browser calls our own Next.js proxy (/api/backend/...)
// which forwards server-side to the internal backend container.
export const api = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    return Promise.reject(error);
  }
);
