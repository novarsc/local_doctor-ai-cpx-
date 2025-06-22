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

/**
 * Gets secondary categories grouped by primary category.
 * @returns {Promise<object>} Object with primary categories as keys and arrays of secondary categories as values.
 */
const getSecondaryCategories = async () => {
    try {
        const response = await apiClient.get('/mock-exams/categories');
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch secondary categories.');
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

export const mockExamService = {
  startMockExam,
  getMockExamSession,
  completeMockExam,
  startCasePractice,
  getSecondaryCategories
};
