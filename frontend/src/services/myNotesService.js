/**
 * @file myNotesService.js
 * @description Service functions for "학습 노트" related API calls.
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

// --- [새로 추가된 부분] ---
/**
 * 상세 오답노트 정보를 가져옵니다 (채팅 기록, 평가 결과 포함).
 * @param {string} scenarioId - 증례 ID
 * @returns {Promise<Object>}
 */
const getDetailedIncorrectNotes = async (scenarioId) => {
  try {
    const response = await apiClient.get(`/my-notes/incorrect-notes/${scenarioId}/detail`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch detailed incorrect notes.');
  }
};

/**
 * 오답노트 작성 여부 상태를 업데이트합니다.
 * @param {string} scenarioId - 증례 ID
 * @param {boolean} hasNote - 노트 작성 여부
 * @returns {Promise<Object>}
 */
const updateNoteStatus = async (scenarioId, hasNote) => {
  try {
    const response = await apiClient.patch(`/my-notes/incorrect-notes/${scenarioId}/status`, { hasNote });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to update note status.');
  }
};

/**
 * 모의고사 세션의 개별 증례들을 가져옵니다.
 * @param {string} mockExamSessionId - 모의고사 세션 ID
 * @returns {Promise<Object>}
 */
const getMockExamCases = async (mockExamSessionId) => {
  try {
    const response = await apiClient.get(`/my-notes/mock-exam/${mockExamSessionId}/cases`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to fetch mock exam cases.');
  }
};
// --- [여기까지 추가] ---

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
  getDetailedIncorrectNotes,
  saveIncorrectNoteMemo,
  updateNoteStatus,
  getLearningHistory,
  addBookmark,
  removeBookmark,
  getPracticedScenarios,
  getMockExamCases,
};