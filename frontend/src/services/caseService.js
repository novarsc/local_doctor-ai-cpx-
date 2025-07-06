/**
 * @file caseService.js
 * @description Service functions for scenario (case) related API calls.
 */

import apiClient from './apiClient';

/**
 * Fetches a list of scenarios from the backend.
 * @param {object} params - Query parameters for filtering, sorting, and pagination.
 * e.g., { page: 1, limit: 10, keyword: '복통' }
 * @returns {Promise<object>} The response data from the API, including scenarios and pagination info.
 */
const getScenarios = async (params) => {
  try {
    const response = await apiClient.get('/cases', { params });
    return response.data;
  } catch (error) {
    // Re-throw the error to be handled by the component/hook
    throw error.response?.data?.error || new Error('Failed to fetch scenarios.');
  }
};

/**
 * Fetches details for a single scenario by its ID.
 * @param {string} scenarioId - The ID of the scenario to fetch.
 * @returns {Promise<object>} The detailed scenario object.
 */
const getScenarioById = async (scenarioId) => {
  try {
    const response = await apiClient.get(`/cases/${scenarioId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch scenario details.');
  }
};

// [추가] 카테고리 목록을 가져오는 서비스 함수
const getCaseCategories = async () => {
  try {
    const response = await apiClient.get('/cases/categories');
    return response.data; // API 응답 전체를 반환 (e.g., { message: "...", data: [...] })
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch categories.');
  }
};

// [추가] 대분류별 중분류 카테고리를 가져오는 서비스 함수
const getSubCategories = async (primaryCategory) => {
  try {
    const response = await apiClient.get(`/cases/categories/${encodeURIComponent(primaryCategory)}/subcategories`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch subcategories.');
  }
};


export const caseService = {
  getScenarios,
  getScenarioById,
  getCaseCategories, // [추가]
  getSubCategories, // [추가]
};