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

export const myNotesService = {
  getBookmarks,
  getIncorrectNotes,
  saveIncorrectNoteMemo,
  getLearningHistory,
};
