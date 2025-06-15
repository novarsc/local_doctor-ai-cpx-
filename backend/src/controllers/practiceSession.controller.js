/**
 * @file practiceSession.controller.js
 * @description Controller for practice session related API requests.
 */

const practiceSessionService = require('../services/practiceSession.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');
const { ChatLog } = require('../models');

const createSession = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const sessionData = req.body;
  const result = await practiceSessionService.startPracticeSession(sessionData, userId);
  res.status(201).json(result);
});

const handleChatMessage = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { messageContent } = req.body;
  const userId = req.user.userId;
  
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
    
    if (completeAiMessage) {
        await ChatLog.create({ 
            practiceSessionId: sessionId, 
            sender: 'AI',
            message: completeAiMessage,
        });
    }
    res.write('data: [DONE]\n\n');

  } catch (error) {
    console.error('Streaming error:', error);
    const errorData = JSON.stringify({ error: { message: error.message, code: error.code } });
    res.write(`data: ${errorData}\n\n`);
  } finally {
    res.end();
  }
});

const completeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId;
  
  const result = await practiceSessionService.completePracticeSession(sessionId, userId);
  res.status(202).json(result);
});

const getFeedback = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await practiceSessionService.getPracticeSessionFeedback(sessionId, userId);
    res.status(200).json(result);
});

// --- 이 함수를 새로 추가합니다 ---
const getChatHistory = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const chatHistory = await practiceSessionService.getChatHistory(sessionId, req.user.userId);
  res.status(200).json(chatHistory);
});
// --- 여기까지 ---


// module.exports에 getChatHistory를 추가합니다.
module.exports = {
  createSession,
  handleChatMessage,
  completeSession,
  getFeedback,
  getChatHistory, // 새로 추가
};