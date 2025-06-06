/**
 * @file practiceSession.controller.js
 * @description Controller for practice session related API requests.
 */

const practiceSessionService = require('../services/practiceSession.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const { ChatLog } = require('../models');

// createSession and handleChatMessage functions remain unchanged...
const createSession = asyncHandler(async (req, res) => {
  const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  const sessionData = req.body;
  const result = await practiceSessionService.startPracticeSession(sessionData, userId);
  res.status(201).json(result);
});
const handleChatMessage = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { messageContent } = req.body;
  const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  try {
    const stream = await practiceSessionService.sendMessageAndGetResponse(sessionId, userId, messageContent);
    let completeAiMessage = '';
    for await (const chunk of stream) {
      const text = chunk.text();
      completeAiMessage += text;
      res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
    }
    if (completeAiMessage) await ChatLog.create({ practiceSessionId: sessionId, sender: 'ai', content: completeAiMessage, contentType: 'text' });
    res.write('data: [DONE]\n\n');
  } catch (error) {
    console.error('Streaming error:', error);
    const errorData = JSON.stringify({ error: { message: error.message, code: error.code } });
    res.write(`data: ${errorData}\n\n`);
  } finally {
    res.end();
  }
});


/**
 * Handles the request to complete a practice session and start evaluation.
 */
const completeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Placeholder User ID
  
  const result = await practiceSessionService.completePracticeSession(sessionId, userId);
  
  // As per API spec 2.5.7, we return 202 Accepted
  res.status(202).json(result);
});

/**
 * Handles the request to get the feedback for a completed session.
 */
const getFeedback = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Placeholder User ID

    const result = await practiceSessionService.getPracticeSessionFeedback(sessionId, userId);

    res.status(200).json(result);
});

module.exports = {
  createSession,
  handleChatMessage,
  completeSession,
  getFeedback,
};
