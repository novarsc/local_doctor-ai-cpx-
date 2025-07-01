/**
 * @file apiClient.js
 * @description Centralized API client configuration using Axios.
 * It handles base URL, authentication headers, and token refresh logic.
 */

import axios from 'axios';
// We'll create this helper module in a later step to manage tokens in local storage.
import { getToken, setToken, getRefreshToken, clearTokens } from '../utils/localStorageHelper'; 

const apiClient = axios.create({
  // 백엔드 서버 주소를 직접 입력합니다. (포트 3000번)
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// This interceptor adds the Authorization header to every authenticated request.
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getToken();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// This interceptor handles token expiration and refreshing logic.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // 모의고사 진행 중인지 확인
        const currentPath = window.location.pathname;
        const isMockExamInProgress = currentPath.includes('/mock-exams/') && currentPath.includes('/case/');
        
        if (isMockExamInProgress) {
          // 모의고사 진행 중이면 경고만 표시하고 리다이렉트하지 않음
          console.warn('모의고사 진행 중 토큰이 만료되었습니다. 세션을 완료한 후 다시 로그인해주세요.');
          return Promise.reject(error);
        }
        
        // Handle logout
        clearTokens();
        window.location.href = '/login'; // Or use React Router history
        return Promise.reject(error);
      }
      
      try {
        const { data } = await apiClient.post('/auth/refresh-token', { refreshToken });
        const { accessToken: newAccessToken } = data;
        
        setToken(newAccessToken); // Assuming setToken updates both access token in memory/storage
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
        
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // 모의고사 진행 중인지 확인
        const currentPath = window.location.pathname;
        const isMockExamInProgress = currentPath.includes('/mock-exams/') && currentPath.includes('/case/');
        
        if (isMockExamInProgress) {
          // 모의고사 진행 중이면 경고만 표시하고 리다이렉트하지 않음
          console.warn('모의고사 진행 중 토큰 갱신에 실패했습니다. 세션을 완료한 후 다시 로그인해주세요.');
          return Promise.reject(refreshError);
        }
        
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default apiClient;
