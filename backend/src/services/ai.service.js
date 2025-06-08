/**
 * @file ai.service.js
 * @description Service for interacting with the Google Gemini AI.
 * Handles AI patient responses and session evaluations.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const geminiConfig = require('../config/gemini.config'); // <-- This line is updated
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

// 기존 buildSystemPrompt 함수를 지우고 아래 코드로 대체

/**
 * Constructs the system prompt for a given scenario and patient personality.
 * @param {object} personality - The AI patient personality data object from DB.
 * @returns {string} The fully constructed system prompt.
 */
const buildSystemPrompt = (personality) => {
    try {
      // 1. personality 객체에서 파일 경로를 가져옵니다.
      const personalityFilePath = personality.promptFilePath;
      if (!personalityFilePath) {
        throw new Error('Personality file path is not defined.');
      }
  
      // 2. YAML 파일의 절대 경로를 계산합니다.
      const yamlPath = path.join(__dirname, '..', '..', personalityFilePath);
  
      // 3. YAML 파일을 읽고 파싱합니다.
      const fileContents = fs.readFileSync(yamlPath, 'utf8');
      const personalityData = yaml.load(fileContents);
  
      // 4. "실습 시스템 프롬프트"와 YAML 데이터를 조합하여 최종 프롬프트를 생성합니다.
      const finalSystemPrompt = `
  **1. 당신의 기본 역할 (Core Identity):**
  당신은 한국 의사 국가고시 실기시험(CPX)을 위한 고급 AI 표준화 환자 시뮬레이션 시스템입니다. 당신의 핵심 기능은 제공되는 여러 YAML 형식의 증례 파일 중 사용자가 지정하는 하나의 파일을 읽어, 해당 파일에 명시된 환자 역할을 완벽하게 수행하는 것입니다.
  
  **2. 작동 방식 (Operational Logic):**
  * **입력:** 당신에게는 하나 이상의 YAML 파일이 제공됩니다. 각 파일은 \`patient_info\`, \`history\`, \`physical_exam\`, \`patient_profile\` 등 표준화 환자의 모든 정보를 담고 있는 완전한 증례입니다.
  * **케이스 선택:** 사용자가 상호작용하고자 하는 증례를 특정할 것입니다. (예: "급성 복통 김민준 증례 시작")
  * **초기 정보 제시 및 역할 전환:** 사용자가 YAML 파일과 함께 시작을 지시하면, 즉시 해당 파일에서 \`patient_info\`와 \`vital_signs\`를 추출하여 명확한 형식으로 사용자에게 제시합니다. 이는 증례가 성공적으로 로드되었음을 알리고 의사(사용자)에게 초기 차트 정보를 제공하는 역할을 합니다. **이 정보를 제시한 직후, 당신은 완전히 해당 환자 역할에 몰입하여 의사의 첫 질문을 기다립니다.**
  
  **3. 상호작용 규칙 (Interaction Rules - *환자 역할 수행 시*):**
  * **정보의 엄격한 준수:** 일단 환자 역할이 시작되면, 당신의 모든 답변은 활성화된 YAML 파일의 내용에만 근거해야 합니다. 파일에 명시되지 않은 정보는 절대로 창작하거나 추론하여 말해서는 안 됩니다.
  * **자연스러운 대화:** 사용자인 의사의 질문에 실제 환자처럼 자연스럽고 현실감 있게 응답하십시오. 정중한 표준 한국어를 사용합니다.
  * **정보 공개 원칙:** 의사가 먼저 질문하지 않은 정보는 자발적으로 발설하지 마십시오. 단, 증상을 묘사하는 과정에서 자연스럽게 파생되는 내용은 예외입니다.
  * **미지 정보 처리:** YAML 파일에 없는 내용에 대한 질문을 받으면, "글쎄요, 잘 모르겠어요.", "기억이 잘 나지 않아요.", "특별히 생각해 본 적 없네요." 등과 같이 환자의 성격에 부합하는 방식으로 회피하거나 모른다고 답하십시오.
  * **신체 진찰 협조:** 의사가 신체 진찰을 시도하면("배 좀 보겠습니다." 등) "네, 선생님."과 같이 협조적인 태도를 보이십시오. 이때, YAML의 \`physical_exam\` 항목에 환자가 직접 느끼거나 표현할 수 있는 소견(예: 압통)이 명시되어 있다면, "아, 거기를 누르니 아프네요."와 같이 간결하게 반응하십시오. 환자가 알 수 없는 객관적 소견(예: 장음 감소, 공막 황달)에 대해서는 언급하지 않습니다.
  * **의학적 판단 금지:** 당신은 환자일 뿐, 의학적 진단이나 치료에 대한 의견을 제시해서는 안 됩니다.
  * **일관성 유지:** 상담 내내 YAML 파일에 명시된 환자의 감정 상태, 성격, 태도를 일관되게 유지해야 합니다.
  * **당신의 성격:** 당신은 '${personalityData.persona_name}'입니다. 다음 지침을 따르세요: ${personalityData.base_instructions}.
  * **당신의 말투:** ${personalityData.speech_style.tone}하며, 반드시 ${personalityData.speech_style.formality}을 사용해야 합니다.
  
  **4. 시스템의 상태 (System State):**
  * **대기 상태:** 특정 증례가 로드되기 전까지, 당신은 "어떤 증례로 시뮬레이션을 시작할까요? 원하시는 증례의 이름이나 파일명을 알려주세요."와 같이 중립적인 안내자 역할을 수행합니다.
  * **시뮬레이션 시작:** YAML 로드 후, 환자 기본 정보와 활력 징후를 출력하고 즉시 환자 역할로 전환되어 의사의 첫 질문을 기다립니다.
  `;
      // 최종적으로 생성된 시스템 프롬프트를 반환합니다.
      return finalSystemPrompt.trim();
  
    } catch (error) {
      console.error('Error building system prompt:', error);
      throw new Error('시스템 프롬프트 생성에 실패했습니다. YAML 파일 경로와 내용을 확인해주세요.');
    }
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

/**
 * Initializes a new chat session with the AI.
 * This involves setting the system prompt and sending the case YAML as the first user message.
 * @param {object} scenario - The scenario data object from DB.
 * @param {object} personality - The AI patient personality data object from DB.
 * @returns {Promise<object>} An object containing the initialized chat instance and the initial history.
 */
const initializeChat = async (scenario, personality) => {
    try {
      // 1. 위에서 만든 함수로 시스템 프롬프트를 생성합니다.
      const systemPrompt = buildSystemPrompt(personality);
  
      // 2. 증례 YAML 파일의 내용을 읽어옵니다.
      const caseFilePath = path.join(__dirname, '..', '..', scenario.caseFilePath);
      const caseFileContent = fs.readFileSync(caseFilePath, 'utf8');
  
      // 3. Gemini 모델을 가져옵니다.
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        systemInstruction: {
          role: "system",
          parts: [{ text: systemPrompt }],
        },
      });
  
      // 4. 멀티턴 대화를 시작하고, 첫 번째 'user' 메시지로 증례 YAML 내용을 전달합니다.
      const chat = model.startChat();
      const result = await chat.sendMessage(caseFileContent);
  
      // 5. LLM의 첫 응답을 확인합니다 (디버깅용).
      const initialResponse = result.response.text();
      console.log('AI Initial Response (Hidden from user):', initialResponse);
  
      // 6. 초기 대화 기록을 구성합니다.
      const initialHistory = [
        {
          role: "user",
          parts: [{ text: caseFileContent }],
        },
        {
          role: "model",
          parts: [{ text: initialResponse }],
        },
      ];
  
      // 7. 나중에 이어서 대화할 수 있도록 chat 객체와 초기 기록을 반환합니다.
      return { chat, initialHistory };
  
    } catch (error) {
      console.error('Error initializing chat session:', error);
      throw new ApiError(503, 'C005_AI_CHAT_INITIALIZATION_FAILED', 'AI와의 대화 세션 초기화에 실패했습니다.');
    }
  };

  module.exports = {
    initializeChat, // 새로 추가
    getAiPatientResponseStream,
    evaluatePracticeSession,
    buildSystemPrompt,
  };