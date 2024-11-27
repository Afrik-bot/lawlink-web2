import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Load environment variables with validation
const validateEnvVar = (value: string | undefined, defaultValue: number): number => {
  const parsed = value ? parseInt(value, 10) : defaultValue;
  return isNaN(parsed) ? defaultValue : parsed;
};

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const MAX_RETRIES = validateEnvVar(process.env.REACT_APP_MAX_RETRIES, 3);
const INITIAL_RETRY_DELAY = validateEnvVar(process.env.REACT_APP_INITIAL_RETRY_DELAY, 1000);
const REQUEST_TIMEOUT = validateEnvVar(process.env.REACT_APP_REQUEST_TIMEOUT, 30000);

// Custom config interface to handle retry logic
interface RetryConfig extends Omit<InternalAxiosRequestConfig, 'headers'> {
  _retry?: boolean;
  _retryCount?: number;
  headers: Record<string, string>;
  withCredentials: boolean;
}

// Define types for API responses
interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
  statusCode?: number;
}

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL.replace(/\/$/, ''), // Remove trailing slash if present
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Required for CORS with credentials
  maxRedirects: 5,
  maxBodyLength: 5 * 1024 * 1024, // 5MB
  maxContentLength: 5 * 1024 * 1024, // 5MB
  timeoutErrorMessage: 'Request timeout - please try again',
  validateStatus: (status) => status >= 200 && status < 500, // Don't reject if status < 500
});

// Error handling utilities
const isNetworkError = (error: AxiosError): boolean => {
  return !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
};

const isCORSError = (error: AxiosError): boolean => {
  return error.message.includes('CORS') || error.message.includes('Cross-Origin');
};

// Retry configuration
const shouldRetry = (error: AxiosError): boolean => {
  const status = error.response?.status;
  const config = error.config as RetryConfig | undefined;
  
  // Don't retry if we've already retried MAX_RETRIES times
  if (!config || (config._retryCount && config._retryCount >= MAX_RETRIES)) {
    return false;
  }

  // Don't retry on specific error codes that indicate client errors
  if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
    return false;
  }

  // Include network errors and server errors
  return Boolean(
    isNetworkError(error) || // Network errors
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    (status && status >= 500) // Server errors
  );
};

const retryRequest = async (error: AxiosError): Promise<any> => {
  const config = error.config as RetryConfig | undefined;
  
  if (!config || !shouldRetry(error)) {
    return Promise.reject(error);
  }

  config._retryCount = (config._retryCount || 0) + 1;
  
  // Exponential backoff with jitter
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, config._retryCount - 1);
  const jitter = delay * 0.1 * Math.random();
  const totalDelay = Math.min(delay + jitter, 10000); // Cap at 10 seconds
  
  console.log(`Retrying request (attempt ${config._retryCount}/${MAX_RETRIES}) after ${totalDelay}ms`);
  
  // Clone the config to prevent mutation
  const newConfig = { ...config };
  
  // Clear any stale headers and ensure fresh ones
  if (newConfig.headers) {
    delete newConfig.headers['X-Request-ID'];
    delete newConfig.headers['If-None-Match']; // Clear cache headers
    delete newConfig.headers['If-Modified-Since'];
    
    // Ensure fresh content headers
    newConfig.headers['Cache-Control'] = 'no-cache';
    newConfig.headers['Pragma'] = 'no-cache';
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(axiosInstance(newConfig));
    }, totalDelay);
  });
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      // Add auth token if available
      const token = localStorage.getItem(process.env.REACT_APP_JWT_LOCAL_STORAGE_KEY || 'lawlink_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Ensure content type is set
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json';
      }

      // Ensure URL is properly formed
      if (config.url) {
        config.url = config.url.replace(/([^:]\/)\/+/g, '$1').trim(); // Remove duplicate slashes and trim
      }

      // Add timestamp to prevent caching
      const separator = config.url?.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;

      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(new Error('Error preparing request. Please try again.'));
    }
  },
  (error: AxiosError) => {
    console.error('Request error:', error.message);
    return Promise.reject(new Error('Error initializing request. Please try again.'));
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const config = error.config as RetryConfig | undefined;
    
    if (!config) {
      console.error('Invalid request configuration');
      return Promise.reject(new Error('Invalid request configuration. Please refresh the page and try again.'));
    }

    // Log detailed error information
    console.error('API Error:', {
      url: config.url,
      method: config.method,
      status: error.response?.status,
      message: error.message,
      code: error.code,
      data: error.response?.data,
    });

    // Handle network errors with retry logic
    if (shouldRetry(error) && !config._retry) {
      config._retry = true;
      try {
        return await retryRequest(error);
      } catch (retryError) {
        console.error('All retry attempts failed:', retryError);
        if (isNetworkError(error)) {
          return Promise.reject(new Error('Unable to connect to the server. Please check if the server is running and try again.'));
        }
        return Promise.reject(new Error('Service temporarily unavailable. Please try again in a few moments.'));
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        localStorage.removeItem(process.env.REACT_APP_JWT_LOCAL_STORAGE_KEY || 'lawlink_auth_token');
        window.location.href = '/login';
      } catch (e) {
        console.error('Error during auth error handling:', e);
      }
      return Promise.reject(new Error('Your session has expired. Please log in again.'));
    }

    // Handle CORS and network errors specifically
    if (isNetworkError(error)) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Connection failed. Please verify that the server is running at ' + API_BASE_URL));
    }

    if (isCORSError(error)) {
      console.error('CORS error:', error.message);
      return Promise.reject(new Error('Cross-origin request blocked. Please check server configuration.'));
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn('Rate limited. Retry after:', retryAfter);
      return Promise.reject(new Error('Too many requests. Please wait a moment before trying again.'));
    }

    // Handle validation errors
    if (error.response?.status === 422) {
      const errorData = error.response.data;
      if (errorData?.errors) {
        // Combine all error messages
        const errorMessages = Object.values(errorData.errors).flat();
        return Promise.reject(new Error(errorMessages.join('. ')));
      }
      // Fallback to generic message
      return Promise.reject(new Error(errorData?.message || 'Please check your input and try again.'));
    }

    // Handle server errors
    if (error.response?.status && error.response.status >= 500) {
      return Promise.reject(new Error('Server error occurred. Our team has been notified.'));
    }

    // Handle other errors with proper message extraction
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        'An unexpected error occurred. Please try again.';
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Health check function with timeout
const checkApiHealth = async (timeout = 5000): Promise<boolean> => {
  try {
    await axiosInstance.get('/health', { 
      timeout,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Ping function to keep connection alive
const pingServer = async (): Promise<void> => {
  try {
    await axiosInstance.get('/ping', { 
      timeout: 5000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Ping failed:', error);
  }
};

// Keep connection alive with periodic pings
const pingInterval = validateEnvVar(process.env.REACT_APP_PING_INTERVAL, 30000);
let keepAliveInterval: NodeJS.Timeout | null = null;

// Start ping interval with error handling
const startPingInterval = () => {
  try {
    if (!keepAliveInterval) {
      keepAliveInterval = setInterval(pingServer, pingInterval);
      console.log('Ping interval started');
    }
  } catch (error) {
    console.error('Error starting ping interval:', error);
  }
};

// Cleanup function with error handling
const cleanup = () => {
  try {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
      console.log('Ping interval cleaned up');
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Check server connection immediately
checkApiHealth().then((isHealthy) => {
  if (!isHealthy) {
    console.error('Warning: API server may not be running at ' + API_BASE_URL);
  }
});

export default axiosInstance;
export { checkApiHealth, startPingInterval, cleanup };
