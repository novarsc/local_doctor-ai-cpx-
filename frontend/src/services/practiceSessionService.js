/**
 * @file practiceSessionService.js
 * @description Service functions for practice session related API calls.
 */

import apiClient from './apiClient';

/**
 * Starts a new practice session.
 * @param {object} sessionConfig - Configuration for the new session.
 * @returns {Promise<object>} The newly created practice session details.
 */
const startPracticeSession = async (sessionConfig) => {
  try {
    const response = await apiClient.post('/practice-sessions', sessionConfig);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || new Error('Failed to start practice session.');
  }
};

/**
 * Sends a chat message and handles the streaming response.
 * @param {object} params - The parameters for sending a message.
 */
const sendChatMessageAndStream = async ({ sessionId, messageContent, onData, onEnd, onError }) => {
  try {
    const response = await fetch(`${apiClient.defaults.baseURL}/practice-sessions/${sessionId}/chat-messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('aichpx_access_token')}`,
      },
      body: JSON.stringify({ messageContent }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const rawChunk = decoder.decode(value);
      const lines = rawChunk.split('\n').filter(line => line.trim());
      
      for(const line of lines) {
        if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (dataStr === '[DONE]') {
                onEnd();
                return;
            }
            try { onData(JSON.parse(dataStr)); } 
            catch (e) { console.error("Failed to parse stream data:", dataStr, e); onError(e); }
        }
      }
    }
  } catch (error) {
    console.error("Streaming chat message failed:", error);
    onError(error);
  }
};

/**
 * Completes a practice session and requests an evaluation.
 * @param {string} sessionId - The ID of the practice session.
 * @returns {Promise<object>} The API response confirming the request.
 */
const completePracticeSession = async (sessionId) => {
    try {
        const response = await apiClient.post(`/practice-sessions/${sessionId}/complete`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to complete the session.');
    }
};

/**
 * Fetches the evaluation feedback for a completed session.
 * @param {string} sessionId - The ID of the practice session.
 * @returns {Promise<object>} The feedback data.
 */
const getFeedback = async (sessionId) => {
    try {
        const response = await apiClient.get(`/practice-sessions/${sessionId}/feedback`);
        return response.data;
    } catch (error) {
        throw error.response?.data?.error || new Error('Failed to fetch feedback.');
    }
};

export const practiceSessionService = {
  startPracticeSession,
  sendChatMessageAndStream,
  completePracticeSession,
  getFeedback,
};
