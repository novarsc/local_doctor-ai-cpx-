/**
 * @file ai.service.js
 * @description Service for interacting with the Google Gemini AI.
 * Handles AI patient responses and session evaluations.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const geminiConfig = require('../config/gemini.config'); // <-- This line is updated
const ApiError = require('../utils/ApiError');

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

/**
 * Constructs the system prompt for a given scenario and patient personality.
 * @param {object} scenario - The scenario data object.
 * @param {object} personality - The AI patient personality data object.
 * @returns {string} The fully constructed system prompt.
 */
const buildSystemPrompt = (scenario, personality) => {
  // This function will dynamically build the detailed system prompt
  // provided by the user using data from the database.
  // For now, it returns a placeholder.
  console.log('Building prompt for scenario:', scenario.name);
  return `AI 환자 시스템 프롬프트: [${scenario.name}] - [${scenario.patientName}] (상세 프롬프트 내용 생략)`;
};

/**
 * Generates a streaming response from the AI patient.
 * Uses a 'non-think' model (Gemini Flash) for fast interaction.
 * @param {string} systemPrompt - The master prompt defining the AI's role.
 * @param {Array<object>} chatHistory - The history of the conversation.
 * @param {string} userMessage - The latest message from the user.
 * @returns {Promise<AsyncGenerator>} A stream of response chunks.
 */
const getAiPatientResponseStream = async (systemPrompt, chatHistory, userMessage) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest", // As per requirement for practice sessions
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7, // Adjust for realistic patient responses
      },
    });

    const result = await chat.sendMessageStream(userMessage);
    return result.stream;
  } catch (error) {
    console.error('Error getting AI response stream:', error);
    throw new ApiError(503, 'C004_SERVICE_UNAVAILABLE', 'Failed to get response from AI service.');
  }
};


/**
 * Evaluates a completed practice session using a 'think' model (Gemini Pro).
 * @param {object} practiceSessionData - Data including chat logs and scenario info.
 * @returns {Promise<object>} The structured evaluation result.
 */
const evaluatePracticeSession = async (practiceSessionData) => {
    const { chatLogs, scenario, checklist } = practiceSessionData;

    const evaluationPrompt = `
      당신은 CPX 수행 능력을 평가하는 전문 평가자입니다.
      아래의 대화 내용과 체크리스트를 기반으로 사용자의 CPX 과정을 종합적으로 평가해주세요.

      [증례 정보]
      - 증례명: ${scenario.name}
      - 진단명: ${scenario.diagnosis}

      [평가 체크리스트]
      ${checklist.map(item => `- ${item.text}`).join('\n')}

      [사용자와 AI 환자의 전체 대화 내용]
      ${chatLogs.map(log => `${log.sender}: ${log.content}`).join('\n')}

      ---
      [평가 지침]
      사용자가 "끝"이라고 언급했습니다. cpx 체크리스트를 기반으로 사용자가 놓친 질문은 무엇인지, 
      수행한 항목과 수행하지 못한 항목을 명확히 구분해주세요.
      잘한 점과 개선할 점을 구체적인 대화 내용을 예시로 들어 설명해주세요.
      최종적으로, API 명세서의 '실습 세션 피드백/결과 조회' 응답 형식에 맞는 JSON 객체를 생성하여 반환해주세요.
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        const result = await model.generateContent(evaluationPrompt);
        const responseText = result.response.text();
        
        // The model is asked to return a JSON string, so we parse it.
        return JSON.parse(responseText);
    } catch (error) {
        console.error('Error evaluating practice session:', error);
        throw new ApiError(503, 'C004_SERVICE_UNAVAILABLE', 'Failed to evaluate the session with AI service.');
    }
};


module.exports = {
  getAiPatientResponseStream,
  evaluatePracticeSession,
  buildSystemPrompt,
};
