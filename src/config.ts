export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    endpoints: {
      auth: {
        register: '/auth/register',
        login: '/auth/login',
        currentUser: '/auth/me',
      },
      profiles: '/profiles',
      consultations: '/consultations',
      reviews: '/reviews',
    },
  },
  websocket: {
    url: WEBSOCKET_URL,
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
  },
};
