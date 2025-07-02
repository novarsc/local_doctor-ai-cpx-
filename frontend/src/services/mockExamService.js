/**
 * @file mockExamService.js
 * @description Service functions for mock exam related API calls.
 */

import apiClient from './apiClient';

/**
 * Starts a new mock exam session.
 * @param {object} examConfig - Configuration for the new mock exam.
 * @returns {Promise<object>} The newly created mock exam session object.
 */
const startMockExam = async (examConfig) => {
  try {
    const response = await apiClient.post('/mock-exams', examConfig);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to start the mock exam.');
  }
};

/**
 * Fetches the details of a specific mock exam session.
 * @param {string} mockExamSessionId - The ID of the mock exam session to fetch.
 * @returns {Promise<object>} The detailed mock exam session object.
 */
const getMockExamSession = async (mockExamSessionId) => {
  try {
    console.log('API 호출: getMockExamSession', mockExamSessionId);
    const response = await apiClient.get(`/mock-exams/${mockExamSessionId}`);
    console.log('API 응답 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('API 호출 실패:', error);
    console.error('에러 응답:', error.response?.data);
    console.error('에러 상태:', error.response?.status);
    
    if (error.response?.status === 404) {
      throw new Error(`세션을 찾을 수 없습니다. (ID: ${mockExamSessionId})`);
    } else if (error.response?.status === 401) {
      throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
    } else if (error.response?.status === 403) {
      throw new Error('접근 권한이 없습니다.');
    } else {
      throw error.response?.data?.error || new Error('Failed to fetch mock exam session details.');
    }
  }
};

/**
 * Completes a mock exam session.
 * @param {string} mockExamSessionId - The ID of the mock exam session to complete.
 * @returns {Promise<object>} The completed mock exam session object.
 */
const completeMockExam = async (mockExamSessionId) => {
    try {
        console.log('API 호출: completeMockExam', mockExamSessionId);
        const response = await apiClient.post(`/mock-exams/${mockExamSessionId}/complete`);
        console.log('API 응답 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('API 호출 실패:', error);
        console.error('에러 응답:', error.response?.data);
        console.error('에러 상태:', error.response?.status);
        
        if (error.response?.status === 400) {
            const errorMessage = error.response?.data?.error || '';
            if (errorMessage.includes('evaluations are still in progress') || 
                errorMessage.includes('taking longer than expected')) {
                throw new Error('AI 평가가 예상보다 오래 걸리고 있습니다. 잠시 후 다시 시도해주세요.');
            }
        } else if (error.response?.status === 404) {
            throw new Error(`모의고사 세션을 찾을 수 없습니다. (ID: ${mockExamSessionId})`);
        } else if (error.response?.status === 401) {
            throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        } else if (error.response?.status === 403) {
            throw new Error('접근 권한이 없습니다.');
        }
        
        throw error.response?.data?.error || new Error('Failed to complete the mock exam.');
    }
};

/**
 * Gets secondary categories grouped by primary category.
 * @returns {Promise<object>} Object with primary categories as keys and arrays of secondary categories as values.
 */
const getCases = async () => {
    try {
        const response = await apiClient.get('/mock-exams/categories');
        return response.data.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch cases.');
    }
};

/**
 * Starts a practice session for a specific case in a mock exam.
 * @param {string} mockExamSessionId - The ID of the mock exam session.
 * @param {number} caseNumber - The case number (1-6).
 * @returns {Promise<object>} The practice session details.
 */
const startCasePractice = async (mockExamSessionId, caseNumber) => {
    try {
        const response = await apiClient.post(`/mock-exams/${mockExamSessionId}/cases/${caseNumber}/start`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to start case practice session.');
    }
};

/**
 * Gets evaluation progress for a mock exam session.
 * @param {string} mockExamSessionId - The ID of the mock exam session.
 * @returns {Promise<{completed: number, total: number}>}
 */
const getEvaluationProgress = async (mockExamSessionId) => {
    try {
        const response = await apiClient.get(`/mock-exams/${mockExamSessionId}/evaluation-progress`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch evaluation progress.');
    }
};

export const mockExamService = {
  startMockExam,
  getMockExamSession,
  completeMockExam,
  startCasePractice,
  getCases,
  getEvaluationProgress
};
