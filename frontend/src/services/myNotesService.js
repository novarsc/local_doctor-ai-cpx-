/**
 * @file myNotesService.js
 * @description Service functions for "MY 노트" related API calls.
 */

import apiClient from './apiClient';

// ... (getBookmarks, getIncorrectNotes 등 다른 함수들은 기존과 동일합니다)
const getBookmarks = async () => { try { const response = await apiClient.get('/my-notes/bookmarks'); return response.data.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch bookmarks.'); } };
const getIncorrectNotes = async (scenarioId) => { try { const response = await apiClient.get(`/my-notes/incorrect-notes/${scenarioId}`); return response.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch incorrect notes.'); } };
const saveIncorrectNoteMemo = async (scenarioId, userMemo) => { try { const response = await apiClient.put(`/my-notes/incorrect-notes/${scenarioId}`, { userMemo }); return response.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to save the note.'); } };
const getLearningHistory = async () => { try { const response = await apiClient.get('/my-notes/history'); return response.data.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch learning history.'); } };

/**
 * 특정 증례를 북마크에 추가합니다.
 * @param {string} scenarioId - 북마크할 증례의 ID
 * @returns {Promise<object>} 생성된 북마크 정보
 */
const addBookmark = async (scenarioId) => {
  try {
    // 1. API 경로를 '/scenarios/'에서 '/cases/'로 수정합니다.
    const response = await apiClient.post(`/cases/${scenarioId}/bookmark`);
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
    // 2. API 경로를 '/scenarios/'에서 '/cases/'로 수정합니다.
    await apiClient.delete(`/cases/${scenarioId}/bookmark`);
  } catch (error) {
    throw error.response?.data?.error || new Error('북마크 삭제에 실패했습니다.');
  }
};

export const myNotesService = {
  getBookmarks,
  getIncorrectNotes,
  saveIncorrectNoteMemo,
  getLearningHistory,
  addBookmark,
  removeBookmark,
};
