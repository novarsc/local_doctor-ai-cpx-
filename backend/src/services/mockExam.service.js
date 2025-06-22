/**
 * @file mockExam.service.js
 * @description Business logic for handling mock exams.
 */

const { Scenario, MockExamSession, PracticeSession, AIPatientPersonality } = require('../models');
const { fn, col } = require('sequelize');
// ▼▼▼ 이 부분의 코드를 수정합니다. { } 삭제. ▼▼▼
const ApiError = require('../utils/ApiError');
const aiService = require('./ai.service');
const { setChatHistory } = require('./activeChatHistories');

// ▼▼▼ 디버깅을 위해 이 두 줄을 추가합니다 ▼▼▼
console.log('--- 디버깅: ApiError 변수의 내용물 ---');
console.log(ApiError);
// ▲▲▲ 여기까지 추가 ▲▲▲

const startMockExamSession = async (userId, examType, specifiedCategories = []) => {
    const scenarios = await Scenario.findAll();
    const scenariosByPrimaryCategory = scenarios.reduce((acc, scenario) => {
        (acc[scenario.primaryCategory] = acc[scenario.primaryCategory] || []).push(scenario);
        return acc;
    }, {});
    const allPrimaryCategories = Object.keys(scenariosByPrimaryCategory);
    if (allPrimaryCategories.length < 6) throw new ApiError(500, 'M001_INSUFFICIENT_SCENARIOS', 'Not enough scenarios to create a mock exam.');
    let selectedScenarios = [];
    const chosenPrimaryCategories = allPrimaryCategories.sort(() => 0.5 - Math.random()).slice(0, 6);

    chosenPrimaryCategories.forEach(category => {
        const scenariosInCat = scenariosByPrimaryCategory[category];
        selectedScenarios.push(scenariosInCat[Math.floor(Math.random() * scenariosInCat.length)]);

    });
    const selectedScenariosDetails = selectedScenarios.map(s => ({
        scenarioId: s.scenarioId, name: s.name, primaryCategory: s.primaryCategory, secondaryCategory: s.secondaryCategory, practiceSessionId: null, score: null,
    }));
    const newMockExamSession = await MockExamSession.create({ userId, examType, status: 'started', selectedScenariosDetails });
    return newMockExamSession.toJSON();
};

const getMockExamSession = async (mockExamSessionId, userId) => {
    const session = await MockExamSession.findOne({ where: { mockExamSessionId, userId } });
    if (!session) throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found or access denied.');
    return session.toJSON();
};

const completeMockExamSession = async (mockExamSessionId, userId) => {
    const session = await MockExamSession.findOne({ where: { mockExamSessionId, userId } });
    if (!session) throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found.');

    // 모든 실습 세션을 완료하고 점수를 계산
    const updatedScenariosDetails = [...session.selectedScenariosDetails];
    let totalScore = 0;
    let completedCases = 0;

    for (let i = 0; i < updatedScenariosDetails.length; i++) {
        const caseDetails = updatedScenariosDetails[i];
        
        if (caseDetails.practiceSessionId) {
            // 실습 세션 완료
            const practiceSession = await PracticeSession.findOne({
                where: { practiceSessionId: caseDetails.practiceSessionId, userId }
            });
            
            if (practiceSession && practiceSession.status !== 'completed') {
                // 실습 세션을 완료 상태로 변경
                practiceSession.status = 'completed';
                practiceSession.endTime = new Date();
                await practiceSession.save();
                
                // 평가 결과에서 점수 가져오기
                const { EvaluationResult } = require('../models');
                const evaluationResult = await EvaluationResult.findOne({
                    where: { practiceSessionId: caseDetails.practiceSessionId }
                });
                
                if (evaluationResult) {
                    const score = evaluationResult.overallScore || 0;
                    updatedScenariosDetails[i] = {
                        ...caseDetails,
                        score: score
                    };
                    totalScore += score;
                    completedCases++;
                }
            } else if (practiceSession && practiceSession.finalScore) {
                // 이미 완료된 세션의 경우 기존 점수 사용
                updatedScenariosDetails[i] = {
                    ...caseDetails,
                    score: practiceSession.finalScore
                };
                totalScore += practiceSession.finalScore;
                completedCases++;
            }
        }
    }

    // 평균 점수 계산
    const overallScore = completedCases > 0 ? Math.round(totalScore / completedCases) : 0;

    // 모의고사 세션 완료
    session.status = 'completed';
    session.endTime = new Date();
    session.overallScore = overallScore;
    session.selectedScenariosDetails = updatedScenariosDetails;

    await session.save();

    return session.toJSON();
};

const startCasePracticeSession = async (mockExamSessionId, caseNumber, userId) => {
    // 모의고사 세션 확인
    const mockExamSession = await MockExamSession.findOne({ 
        where: { mockExamSessionId, userId } 
    });
    
    if (!mockExamSession) {
        throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found.');
    }
    
    // caseNumber가 유효한지 확인 (1-6)
    if (caseNumber < 1 || caseNumber > 6) {
        throw new ApiError(400, 'M003_INVALID_CASE_NUMBER', 'Invalid case number. Must be between 1 and 6.');
    }
    
    const caseIndex = caseNumber - 1;
    const caseDetails = mockExamSession.selectedScenariosDetails[caseIndex];
    
    if (!caseDetails) {
        throw new ApiError(404, 'M004_CASE_NOT_FOUND', 'Case not found in mock exam session.');
    }
    
    // 이미 실습 세션이 있는지 확인
    if (caseDetails.practiceSessionId) {
        // 기존 실습 세션 반환
        const existingPracticeSession = await PracticeSession.findOne({
            where: { practiceSessionId: caseDetails.practiceSessionId }
        });
        
        if (existingPracticeSession) {
            // 기존 세션의 채팅 기록을 activeChatHistories에 등록
            const { getSessionChatHistory } = require('./practiceSession.service');
            await getSessionChatHistory(caseDetails.practiceSessionId, userId);
            
            return {
                practiceSessionId: existingPracticeSession.practiceSessionId,
                scenarioId: caseDetails.scenarioId,
                scenarioName: caseDetails.name,
                isResumed: true
            };
        }
    }
    
    // 새로운 실습 세션 생성
    const scenario = await Scenario.findOne({
        where: { scenarioId: caseDetails.scenarioId }
    });
    
    if (!scenario) {
        throw new ApiError(404, 'S001_SCENARIO_NOT_FOUND', 'Scenario not found.');
    }
    
    // AI 성격 정보 가져오기
    const personality = await AIPatientPersonality.findOne({
        where: { personalityId: scenario.defaultAiPersonalityId }
    });
    
    if (!personality) {
        throw new ApiError(404, 'P005_PERSONALITY_NOT_FOUND', 'AI personality not found.');
    }
    
    // AI 서비스를 사용하여 채팅 초기화
    const { history, aiPatientInitialInteraction } = await aiService.initializeChat(scenario, personality);
    
    const newPracticeSession = await PracticeSession.create({
        userId,
        scenarioId: caseDetails.scenarioId,
        selectedAiPersonalityId: scenario.defaultAiPersonalityId, // 기본 AI 성격 사용
        practiceMode: 'mock_exam', // 모의고사 모드로 설정
        status: 'in_progress',
        startTime: new Date(),
        mockExamSessionId: mockExamSessionId,
        caseNumber: caseNumber
    });
    
    // activeChatHistories에 세션 등록
    setChatHistory(newPracticeSession.practiceSessionId, history);
    
    // 모의고사 세션의 해당 증례에 실습 세션 ID 업데이트
    const updatedScenariosDetails = [...mockExamSession.selectedScenariosDetails];
    updatedScenariosDetails[caseIndex] = {
        ...caseDetails,
        practiceSessionId: newPracticeSession.practiceSessionId
    };
    
    await mockExamSession.update({
        selectedScenariosDetails: updatedScenariosDetails
    });
    
    return {
        practiceSessionId: newPracticeSession.practiceSessionId,
        scenarioId: caseDetails.scenarioId,
        scenarioName: caseDetails.name,
        isResumed: false
    };
};

module.exports = {
  startMockExamSession,
  getMockExamSession,
  completeMockExamSession,
  startCasePracticeSession,
};