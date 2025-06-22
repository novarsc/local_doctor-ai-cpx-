/**
 * @file activeChatHistories.js
 * @description Shared module for managing active chat histories across services
 */

// 전역 activeChatHistories Map
const activeChatHistories = new Map();

/**
 * Set chat history for a session
 * @param {string} sessionId - The session ID
 * @param {Array} history - The chat history
 */
const setChatHistory = (sessionId, history) => {
    activeChatHistories.set(sessionId, history);
};

/**
 * Get chat history for a session
 * @param {string} sessionId - The session ID
 * @returns {Array|null} The chat history or null if not found
 */
const getChatHistory = (sessionId) => {
    return activeChatHistories.get(sessionId) || null;
};

/**
 * Check if a session exists
 * @param {string} sessionId - The session ID
 * @returns {boolean} True if session exists
 */
const hasSession = (sessionId) => {
    return activeChatHistories.has(sessionId);
};

/**
 * Remove a session
 * @param {string} sessionId - The session ID
 */
const removeSession = (sessionId) => {
    activeChatHistories.delete(sessionId);
};

/**
 * Update chat history for a session
 * @param {string} sessionId - The session ID
 * @param {Array} history - The updated chat history
 */
const updateChatHistory = (sessionId, history) => {
    activeChatHistories.set(sessionId, history);
};

module.exports = {
    setChatHistory,
    getChatHistory,
    hasSession,
    removeSession,
    updateChatHistory,
    activeChatHistories
}; 