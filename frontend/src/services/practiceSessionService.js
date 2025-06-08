/**
 * @file practiceSessionService.js
 * @description Service functions for practice session related API calls.
 */

import apiClient from './apiClient';
import { getToken } from '../utils/localStorageHelper'; // <--- 이 줄을 추가하세요!

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
     // 1. (추가된 부분) 스트리밍 요청 전에 간단한 인증 API를 호출하여 토큰을 갱신합니다.
    // 이렇게 하면 apiClient의 인터셉터가 동작하여 토큰이 만료된 경우 새로 발급받습니다.
    await apiClient.get('/users/me'); // 내 정보 조회 API를 사용

   const response = await fetch(
  // 반드시 키보드 숫자 1 왼쪽에 있는 백틱(`)을 사용해야 합니다.
  `${apiClient.defaults.baseURL}/practice-sessions/${sessionId}/chat-messages`, 
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ messageContent }),
  }
);

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
