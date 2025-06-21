/**
 * @file myNotesService.js
 * @description Service functions for "MY 노트" related API calls.
 */

import apiClient from './apiClient';

// --- [추가된 부분] ---
/**
 * 사용자가 학습을 완료한 증례 목록을 가져옵니다.
 * @returns {Promise<Array>}
 */
const getPracticedScenarios = async () => {
  const response = await apiClient.get('/my-notes/practiced-scenarios');
  return response.data;
};
// --- [여기까지 추가] ---


const getBookmarks = async () => { try { const response = await apiClient.get('/my-notes/bookmarks'); return response.data.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch bookmarks.'); } };
const getIncorrectNotes = async (scenarioId) => { try { const response = await apiClient.get(`/my-notes/incorrect-notes/${scenarioId}`); return response.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch incorrect notes.'); } };
const saveIncorrectNoteMemo = async (scenarioId, userMemo) => { try { const response = await apiClient.put(`/my-notes/incorrect-notes/${scenarioId}`, { userMemo }); return response.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to save the note.'); } };
const getLearningHistory = async () => { try { const response = await apiClient.get('/my-notes/history'); return response.data.data; } catch (error) { throw error.response?.data?.error || new Error('Failed to fetch learning history.'); } };

const addBookmark = async (scenarioId) => {
  try {
    const response = await apiClient.post(`/cases/${scenarioId}/bookmark`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('북마크 추가에 실패했습니다.');
  }
};

const removeBookmark = async (scenarioId) => {
  try {
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
  getPracticedScenarios, // 추가
};