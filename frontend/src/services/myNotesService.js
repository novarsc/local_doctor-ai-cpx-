/**
 * @file myNotesService.js
 * @description Service functions for "MY 노트" related API calls.
 */

import apiClient from './apiClient';

// getBookmarks, getIncorrectNotes, saveIncorrectNoteMemo functions remain unchanged...
const getBookmarks = async () => {
  try {
    const response = await apiClient.get('/my-notes/bookmarks');
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch bookmarks.');
  }
};
const getIncorrectNotes = async (scenarioId) => {
    try {
        const response = await apiClient.get(`/my-notes/incorrect-notes/${scenarioId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch incorrect notes.');
    }
};
const saveIncorrectNoteMemo = async (scenarioId, userMemo) => {
    try {
        const response = await apiClient.put(`/my-notes/incorrect-notes/${scenarioId}`, { userMemo });
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to save the note.');
    }
};

/**
 * Fetches the user's entire learning history.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of learning history items.
 */
const getLearningHistory = async () => {
    try {
        const response = await apiClient.get('/my-notes/history');
        return response.data.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch learning history.');
    }
};

/**
 * 특정 증례를 북마크에 추가합니다.
 * @param {string} scenarioId - 북마크할 증례의 ID
 * @returns {Promise<object>} 생성된 북마크 정보
 */
const addBookmark = async (scenarioId) => {
  try {
    // API 명세서 2.3.5.
    const response = await apiClient.post(`/scenarios/${scenarioId}/bookmark`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('북마크 추가에 실패했습니다.');
  }
};

/**
 * 특정 증례를 북마크에서 삭제합니다.
 * @param {string} scenarioId - 북마크 해제할 증례의 ID
 * @returns {Promise<void>}
 */
const removeBookmark = async (scenarioId) => {
  try {
    // API 명세서 2.3.5.
    await apiClient.delete(`/scenarios/${scenarioId}/bookmark`);
  } catch (error) {
    throw error.response?.data?.error || new Error('북마크 삭제에 실패했습니다.');
  }
};

export const myNotesService = {
  getBookmarks,
  getIncorrectNotes,
  saveIncorrectNoteMemo,
  getLearningHistory,
  addBookmark,    // export에 추가
  removeBookmark, // export에 추가
};
