/**
 * @file ai.service.js
 * @description Service for interacting with the Google Gemini AI. This is a stateless service.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const geminiConfig = require('../config/gemini.config');
const ApiError = require('../utils/ApiError');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * 기본 체크리스트 내용을 반환합니다.
 */
function getDefaultChecklistContent() {
    return `
case_id: "default_checklist"
title: "기본 채점표"
sections:
  - name: "병력 청취"
    subsections:
      - name: "기본"
        items:
          - "주요 증상을 확인하였다."
          - "증상의 시작 시점을 확인하였다."
          - "증상의 위치와 양상을 확인하였다."
          - "증상의 강도를 확인하였다."
          - "악화 및 완화 인자를 확인하였다."
  - name: "신체 진찰"
    subsections:
      - name: "기본"
        items:
          - "시진을 시행하였다."
          - "청진을 시행하였다."
          - "타진을 시행하였다."
          - "촉진을 시행하였다."
  - name: "환자 교육"
    subsections:
      - name: "기본"
        items:
          - "진단에 대해 설명하였다."
          - "치료 계획을 설명하였다."
          - "추가 검사의 필요성을 설명하였다."
            `;
}

/**
 * 새로운 체크리스트 구조(checklist format)를 기존 구조로 변환합니다.
 * @param {Object} checklistData - 파싱된 체크리스트 데이터
 * @returns {Object} 변환된 체크리스트 데이터 
 */
function normalizeChecklistStructure(checklistData) {
    // 새로운 형식인지 확인 (checklist > sections 구조)
    if (checklistData.checklist && checklistData.checklist.sections) {
        const newData = {
            case_id: checklistData.checklist.topic_kr || "converted_checklist",
            title: checklistData.checklist.topic_kr || "변환된 채점표",
            sections: []
        };

        for (const section of checklistData.checklist.sections) {
            const convertedSection = {
                name: section.title_kr || section.title_en || "미분류",
                subsections: []
            };

            if (section.items && Array.isArray(section.items)) {
                for (const item of section.items) {
                    const subsection = {
                        name: item.subtitle_kr || item.subtitle_en || "기본",
                        items: []
                    };

                    // details 필드에서 체크리스트 항목들을 추출
                    if (item.details) {
                        const lines = item.details.split('\n');
                        for (const line of lines) {
                            // "- [ ]" 패턴으로 시작하는 체크리스트 항목 찾기
                            const match = line.match(/^\s*-\s*\[\s*\]\s*(.+?)(?:\s*\([^)]+\))?\s*$/);
                            if (match) {
                                // 한국어 부분만 추출 (영어 번역 제거)
                                let cleanText = match[1].trim();
                                // "내용 (English translation)" 패턴에서 한국어만 추출
                                const koreanMatch = cleanText.match(/^([^(]+?)(?:\s*\([^)]+\))?\s*$/);
                                if (koreanMatch) {
                                    cleanText = koreanMatch[1].trim();
                                }
                                subsection.items.push(cleanText);
                            }
                        }
                    }

                    if (subsection.items.length > 0) {
                        convertedSection.subsections.push(subsection);
                    }
                }
            }

            if (convertedSection.subsections.length > 0) {
                newData.sections.push(convertedSection);
            }
        }

        return newData;
    }

    // 기존 형식이면 그대로 반환
    return checklistData;
}

// API 키가 정의되지 않은 경우, 즉시 오류를 발생시켜 서버 시작을 막습니다.
if (!geminiConfig.apiKey) {
  throw new Error("FATAL ERROR: GEMINI_API_KEY is not defined in the .env file. The AI service cannot start.");
}

const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

const SYSTEM_PROMPT = `**1. 당신의 기본 역할 (Core Identity):**
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

**4. 시스템의 상태 (System State):**
* **대기 상태:** 특정 증례가 로드되기 전까지, 당신은 "어떤 증례로 시뮬레이션을 시작할까요? 원하시는 증례의 이름이나 파일명을 알려주세요."와 같이 중립적인 안내자 역할을 수행합니다.
* **시뮬레이션 시작:** YAML 로드 후, 환자 기본 정보와 활력 징후를 출력하고 즉시 환자 역할로 전환되어 의사의 첫 질문을 기다립니다.`;

/**
 * Initializes a new chat session and returns the chat object and initial history.
 * This function is stateless and does not store the session.
 * @param {object} scenario - The scenario data object from DB.
 * @param {object} personality - The AI patient personality data object from DB.
 * @returns {Promise<{history: Array<object>, aiPatientInitialInteraction: object}>}
 */
const initializeChat = async (scenario, personality) => {
  try {
    const caseFileContent = fs.readFileSync(path.join(__dirname, '..', '..', scenario.caseFilePath), 'utf8');
    const personalityFileContent = fs.readFileSync(path.join(__dirname, '..', '..', personality.promptFilePath), 'utf8');

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-06-17",
      systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
    });

    const chat = model.startChat();
    
    const initialUserPrompt = `
      지금부터 당신이 연기해야 할 역할의 대본입니다. 이 대본을 완전히 숙지하고, 의사(사용자)의 첫 질문을 기다리세요.

      --- [환자 성격 대본] ---
      ${personalityFileContent}

      --- [증례 대본] ---
      ${caseFileContent}
    `;

    const result = await chat.sendMessage(initialUserPrompt);
    const initialAiResponse = result.response.text();
    
    console.log('AI Initial Response (환자 역할 시작):', initialAiResponse);

    // 대화 기록을 반환하여 practiceSession.service에서 관리하도록 합니다.
    const history = [
        { role: 'user', parts: [{ text: initialUserPrompt }] },
        { role: 'model', parts: [{ text: initialAiResponse }] }
    ];

    return {
      history,
      aiPatientInitialInteraction: {
        type: 'text',
        data: {
          messageId: 'chat-msg-0',
          sender: 'ai',
          content: initialAiResponse,
          timestamp: new Date().toISOString(),
        },
      },
    };

  } catch (error) {
    console.error('Error initializing chat session:', error);
    throw new ApiError(503, 'C005_AI_CHAT_INITIALIZATION_FAILED', 'AI와의 대화 세션 초기화에 실패했습니다.');
  }
};

/**
 * Sends a subsequent message and gets a streaming response.
 * @param {Array<object>} history - The full conversation history.
 * @param {string} messageContent - The new user's message.
 * @returns {Promise<AsyncGenerator>} A stream of response chunks.
 */
const sendMessageAndGetResponse = async (history, messageContent) => {
  if (!history) {
    throw new ApiError(500, 'AI_CHAT_HISTORY_NOT_PROVIDED', 'Chat history was not provided to AI service.');
  }
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
  });
  
  const contents = [
      ...history,
      { role: 'user', parts: [{ text: messageContent }] }
  ];
  
  // --- LLM에 전달되는 전체 내용 확인 로그 ---
  console.log('--- [LLM PROMPT CHECK] ---');
  console.log('--- Sending to LLM:');
  console.log(JSON.stringify(contents, null, 2)); // 전체 대화 내용을 보기 쉽게 출력
  console.log('--------------------------');

  const result = await model.generateContentStream({ contents });
  return result.stream;
};

/**
 * Evaluates a completed practice session.
 * @param {object} practiceSessionData - Data including chat logs and scenario info.
 * @returns {Promise<object>} The structured evaluation result.
 */
const evaluatePracticeSession = async (practiceSessionData) => {
    const { chatLogs, scenario } = practiceSessionData;

    // 체크리스트 파일 처리
    let checklistFileContent = '';
    let normalizedChecklist = null;
    
    if (scenario.checklistFilePath) {
        try {
            const rawChecklistContent = fs.readFileSync(path.join(__dirname, '..', '..', scenario.checklistFilePath), 'utf8');
            const parsedChecklist = yaml.load(rawChecklistContent);
            
            // 새로운 체크리스트 구조를 기존 구조로 변환
            normalizedChecklist = normalizeChecklistStructure(parsedChecklist);
            checklistFileContent = yaml.dump(normalizedChecklist);
            
            console.log('✅ Checklist loaded and normalized:', scenario.checklistFilePath);
        } catch (error) {
            console.warn(`❌ Checklist file not found: ${scenario.checklistFilePath}, using default checklist`);
            checklistFileContent = getDefaultChecklistContent();
        }
    } else {
        console.warn('⚠️ No checklist file path provided, using default checklist');
        checklistFileContent = getDefaultChecklistContent();
    }

    // Case 파일에서 진단명 추출
    const caseFileContent = fs.readFileSync(path.join(__dirname, '..', '..', scenario.caseFilePath), 'utf8');
    let diagnosis = '진단명 없음';
    
    try {
        if (scenario.caseFilePath.endsWith('.json')) {
            // JSON 파일 처리
            const jsonData = JSON.parse(caseFileContent);
            if (jsonData.cases && jsonData.cases.length > 0) {
                const caseData = jsonData.cases[0]; // 첫 번째 케이스 사용
                diagnosis = caseData.diagnosis || caseData.finalDiagnosis || scenario.name || '진단명 없음';
            }
        } else {
            // YAML 파일 처리 (기존 방식)
            const yamlData = yaml.load(caseFileContent);
            diagnosis = yamlData.patient_education?.probable_diagnoses?.[0] || scenario.name || '진단명 없음';
        }
    } catch (error) {
        console.warn('❌ Failed to extract diagnosis from case file, using scenario name');
        diagnosis = scenario.name || '진단명 없음';
    }
    
    console.log('📋 Extracted diagnosis:', diagnosis);

    const evaluationPrompt = `
      **당신의 역할:** 당신은 의과대학 교수로, 학생의 CPX(임상수행능력시험) 수행 능력을 채점하는 평가자입니다. 당신의 평가는 매우 엄격하고 객관적이어야 합니다.

      **평가 자료:**
      1.  **증례 정보:**
          * 증례명: ${scenario.name}
          * 핵심 진단: ${diagnosis}

      2.  **채점 기준 (체크리스트):**
          \`\`\`yaml
          ${checklistFileContent}
          \`\`\`

      3.  **학생과 환자의 전체 대화 기록:**
          ${chatLogs.map(log => `${log.sender === 'USER' ? '의사' : '환자'}: ${log.message}`).join('\n')}

      **과제:**
      위 평가 자료를 바탕으로, 아래 JSON 형식에 맞춰 학생의 수행을 평가하고 채점 결과를 생성해주세요.
      
      **중요한 채점 지침:**
      1. 체크리스트의 각 section → subsection → items 구조를 이해하고, items의 모든 개별 항목을 평가하세요.
      2. 대화가 짧더라도, 실제로 수행한 항목은 'yes', 수행하지 않은 항목은 'no'로 정확히 판단하세요.
      3. 환자가 자발적으로 제공한 정보도 의사가 "확인했다"고 간주할 수 있습니다.
      
      **출력 요구사항:**
      - \`overallScore\`: 체크리스트 수행률을 기반으로 0점에서 100점 사이의 점수를 계산해주세요.
      - \`qualitativeFeedback\`: 학생의 전반적인 수행에 대한 한두 문장의 총평을 작성해주세요.
      - \`checklistResults\`: 체크리스트의 모든 항목에 대해, 학생이 대화에서 실제로 수행했는지 여부('yes' 또는 'no')를 판단하고, 그 근거를 \`aiComment\`에 간략히 서술해주세요.
      - \`goodPoints\`: 학생이 특히 잘한 점 2-3가지를 칭찬해주세요.
      - \`improvementAreas\`: 학생이 놓쳤거나 개선이 필요한 점 2-3가지를 구체적인 대화 내용을 예시로 들어 지적하고, 개선 방안을 제안해주세요.

      **출력 형식 (반드시 이 JSON 구조를 준수해야 합니다):**
      \`\`\`json
      {
        "overallScore": 85,
        "qualitativeFeedback": "전반적으로 문진을 꼼꼼하게 진행했지만, 통증의 방사통과 완화 요인에 대한 질문이 누락되었습니다.",
        "checklistResults": [
          { "nameText": "병력 청취(주제관련)", "itemText": "복통이 시작된 시점을 확인하였다.", "performance": "yes", "aiComment": "대화 초반에 '언제부터 아프셨어요?'라고 질문하여 확인함." },
          { "nameText": "병력 청취(주제관련)", "itemText": "복통의 위치와 이동 양상, 방사통, 빈도를 확인하였다.", "performance": "no", "aiComment": "통증 위치는 확인했으나, 방사통 여부를 질문하지 않았음." }
        ],
        "goodPoints": [
          { "description": "환자의 사회력을 상세히 질문하여 생활 습관과의 연관성을 파악하려 한 점이 돋보입니다." },
          { "description": "개방형 질문을 효과적으로 사용하여 환자가 자신의 증상을 충분히 설명하도록 유도했습니다." }
        ],
        "improvementAreas": [
          { "description": "신체 진찰 시 청진을 먼저 시행해야 한다는 원칙을 지키지 않았습니다.", "advice": "복부 진찰은 항상 시진, 청진, 타진, 촉진 순으로 진행해야 합니다." },
          { "description": "환자 교육 시, 가능한 진단명을 한 가지만 언급하여 다른 가능성을 배제하는 인상을 줄 수 있습니다.", "advice": "환자에게는 가장 가능성 높은 진단을 중심으로 설명하되, 추가 검사가 필요한 이유를 다른 감별 진단과 연관지어 설명하는 것이 좋습니다." }
        ]
      }

     **주의: 다른 어떤 텍스트(설명, 인사 등)나 Markdown 코드 블록도 절대 포함하지 말고, 오직 순수한 JSON 객체만 출력해야 합니다.**
    `;

    // --- 평가용 LLM에 전달되는 내용 확인 로그 ---
    console.log('--- [LLM EVALUATION PROMPT CHECK] ---');
    console.log(evaluationPrompt);
    console.log('-------------------------------------');
    
    try {
        // API 키 검증
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is not set in environment variables');
            throw new Error('GEMINI_API_KEY is required');
        }
        
        console.log('✅ API Key found, attempting AI call...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
        
        console.log('🔄 Calling Gemini API...');
        const result = await model.generateContent(evaluationPrompt);
        const responseText = result.response.text();
        
        // --- AI 응답 전체 로그 ---
        console.log('--- [AI RAW RESPONSE] ---');
        console.log('Length:', responseText.length);
        console.log('Content:', responseText);
        console.log('-------------------------');
        
        let jsonString = responseText;

        // 1. AI가 Markdown 코드 블록을 사용했는지 먼저 확인합니다.
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          console.log('Found JSON code block, extracting content...');
          // 코드 블록이 있다면, 그 안의 내용만 추출합니다.
          jsonString = jsonMatch[1];
        } else {
          console.log('No JSON code block found, using raw response...');
        }

        // 2. 추출된 문자열(또는 원본 문자열)에 대해 JSON 파싱을 시도합니다.
        try {
          console.log('--- [ATTEMPTING JSON PARSE] ---');
          console.log('JSON String to parse:', jsonString.substring(0, 500) + '...');
          const parsedResult = JSON.parse(jsonString);
          console.log('✅ JSON parsing successful!');
          return parsedResult;
        } catch (parseError) {
          // 최종적으로 파싱에 실패하면, 원본 응답을 로그로 남기고 오류를 던집니다.
          console.error("❌ JSON parsing failed!");
          console.error("Parse Error:", parseError.message);
          console.error("AI raw response:", responseText);
          console.error("Attempted to parse:", jsonString);
          throw new Error('Failed to parse evaluation result from AI.');
        }

    } catch (error) {
        console.error('❌ Error evaluating practice session:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Gemini API specific error handling
        if (error.message.includes('API key')) {
            console.error('🔑 API Key issue detected');
        } else if (error.message.includes('quota')) {
            console.error('💰 API quota exceeded');
        } else if (error.message.includes('safety')) {
            console.error('🛡️ Content safety filter triggered');
        }
        
        throw new ApiError(503, 'C004_SERVICE_UNAVAILABLE', 'Failed to evaluate the session with AI service.');
    }
};

module.exports = {
  initializeChat,
  sendMessageAndGetResponse,
  evaluatePracticeSession,
};
