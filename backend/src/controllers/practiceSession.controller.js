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
    
    // AI의 응답이 모두 끝난 후, 전체 메시지를 DB에 저장합니다.
    if (completeAiMessage) {
        // --- 여기가 수정된 부분입니다 ---
        await ChatLog.create({ 
            practiceSessionId: sessionId, 
            sender: 'AI', // 대문자로 수정
            message: completeAiMessage, // 올바른 필드 이름으로 수정
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

module.exports = {
  createSession,
  handleChatMessage,
  completeSession,
  getFeedback,
};
