import apiClient from './apiClient';

/**
 * 사용자의 학습 통계 데이터를 서버에서 가져옵니다.
 * @returns {Promise<object>}
 */
export const getUserStats = async () => {
  const response = await apiClient.get('/users/me/stats');
  return response.data;
};