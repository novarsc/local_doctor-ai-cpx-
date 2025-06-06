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
    const response = await apiClient.get(`/mock-exams/${mockExamSessionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch mock exam session details.');
  }
};

/**
 * Completes a mock exam session.
 * @param {string} mockExamSessionId - The ID of the mock exam session to complete.
 * @returns {Promise<object>} The completed mock exam session object.
 */
const completeMockExam = async (mockExamSessionId) => {
    try {
        const response = await apiClient.post(`/mock-exams/${mockExamSessionId}/complete`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to complete the mock exam.');
    }
};

export const mockExamService = {
  startMockExam,
  getMockExamSession,
  completeMockExam,
};
