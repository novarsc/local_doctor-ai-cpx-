/**
 * @file mockExam.service.js
 * @description Business logic for handling mock exams.
 */

const { Scenario, MockExamSession, PracticeSession, AIPatientPersonality } = require('../models');
const { fn, col } = require('sequelize');
const ApiError = require('../utils/ApiError');
const { updateChatHistory, setChatHistory } = require('./activeChatHistories');
const aiService = require('./ai.service');
const { completePracticeSession, evaluationQueue, processEvaluationQueue } = require('./practiceSession.service');

// ▼▼▼ 디버깅을 위해 이 두 줄을 추가합니다 ▼▼▼
console.log('--- 디버깅: ApiError 변수의 내용물 ---');
console.log(ApiError);
// ▲▲▲ 여기까지 추가 ▲▲▲

const startMockExamSession = async (userId, examType, specifiedCases = []) => {
    const scenarios = await Scenario.findAll();
    const scenariosByPrimaryCategory = scenarios.reduce((acc, scenario) => {
        (acc[scenario.primaryCategory] = acc[scenario.primaryCategory] || []).push(scenario);
        return acc;
    }, {});
    const allPrimaryCategories = Object.keys(scenariosByPrimaryCategory);
    if (allPrimaryCategories.length < 6) throw new ApiError(500, 'M001_INSUFFICIENT_SCENARIOS', 'Not enough scenarios to create a mock exam.');
    
    let selectedScenarios = [];
    
    if (examType === 'random' || specifiedCases.length === 0) {
        // 랜덤 모의고사 로직 (기존과 동일)
        const chosenPrimaryCategories = allPrimaryCategories.sort(() => 0.5 - Math.random()).slice(0, 6);
        
        chosenPrimaryCategories.forEach(category => {
            const scenariosInCat = scenariosByPrimaryCategory[category];
            selectedScenarios.push(scenariosInCat[Math.floor(Math.random() * scenariosInCat.length)]);
        });
    } else {
        // 지정 모의고사 로직 - 개별 케이스 기준
        const scenariosById = scenarios.reduce((acc, scenario) => {
            acc[scenario.scenarioId] = scenario;
            return acc;
        }, {});
        
        // 사용자가 선택한 케이스들을 직접 추가
        for (const caseId of specifiedCases) {
            const scenario = scenariosById[caseId];
            if (scenario) {
                selectedScenarios.push(scenario);
            }
        }
        
        // 선택된 케이스가 6개가 되도록 나머지를 랜덤 선택
        const remainingCount = 6 - selectedScenarios.length;
        if (remainingCount > 0) {
            // 이미 선택된 케이스들을 제외한 나머지 케이스들 중에서 랜덤 선택
            const selectedIds = new Set(selectedScenarios.map(s => s.scenarioId));
            const availableScenarios = scenarios.filter(s => !selectedIds.has(s.scenarioId));
            
            if (availableScenarios.length < remainingCount) {
                throw new ApiError(500, 'M006_INSUFFICIENT_CATEGORIES', '충분한 케이스가 없어 모의고사를 구성할 수 없습니다.');
            }
            
            // 랜덤하게 케이스 선택
            const shuffledScenarios = availableScenarios.sort(() => 0.5 - Math.random());
            const additionalScenarios = shuffledScenarios.slice(0, remainingCount);
            selectedScenarios.push(...additionalScenarios);
        }
    }
    
    const selectedScenariosDetails = selectedScenarios.map(s => ({
        scenarioId: s.scenarioId, 
        name: s.name, 
        primaryCategory: s.primaryCategory, 
        secondaryCategory: s.secondaryCategory, 
        practiceSessionId: null, 
        score: null,
    }));
    
    const newMockExamSession = await MockExamSession.create({ 
        userId, 
        examType, 
        specifiedCategories: examType === 'specified' ? specifiedCases : null,
        status: 'started', 
        selectedScenariosDetails 
    });
    
    return newMockExamSession.toJSON();
};

const getMockExamSession = async (mockExamSessionId, userId) => {
    console.log('=== getMockExamSession 호출 ===');
    console.log('mockExamSessionId:', mockExamSessionId);
    console.log('userId:', userId);
    
    const session = await MockExamSession.findOne({ where: { mockExamSessionId, userId } });
    console.log('조회된 세션:', session ? '존재함' : '존재하지 않음');
    
    if (!session) {
        console.log('세션을 찾을 수 없음 - 에러 발생');
        
        // 디버깅을 위해 해당 사용자의 모든 세션을 조회
        const allUserSessions = await MockExamSession.findAll({ 
            where: { userId },
            attributes: ['mockExamSessionId', 'status', 'createdAt', 'updatedAt']
        });
        console.log('사용자의 모든 세션:', allUserSessions.map(s => s.toJSON()));
        
        // 해당 세션 ID로 조회 (사용자 ID 무관)
        const sessionWithoutUser = await MockExamSession.findOne({ 
            where: { mockExamSessionId },
            attributes: ['mockExamSessionId', 'userId', 'status', 'createdAt', 'updatedAt']
        });
        console.log('사용자 ID 무관 세션 조회:', sessionWithoutUser ? sessionWithoutUser.toJSON() : '없음');
        
        throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found or access denied.');
    }
    
    console.log('세션 조회 성공, 반환:', session.toJSON());
    return session.toJSON();
};

const completeMockExamSession = async (mockExamSessionId, userId) => {
    console.log('=== completeMockExamSession 호출 ===');
    console.log('mockExamSessionId:', mockExamSessionId);
    console.log('userId:', userId);
    
    const { sequelize } = require('../models');
    
    try {
        const session = await MockExamSession.findOne({ 
            where: { mockExamSessionId, userId }
        });
        console.log('조회된 세션:', session ? '존재함' : '존재하지 않음');
        
        if (!session) {
            console.log('세션을 찾을 수 없음 - 에러 발생');
            throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found.');
        }

        // 모든 실습 세션 ID 수집
        const updatedScenariosDetails = [...session.selectedScenariosDetails];
        const practiceSessionIds = updatedScenariosDetails
            .filter(details => details.practiceSessionId)
            .map(details => details.practiceSessionId);
        
        console.log('평가 대상 실습 세션 ID:', practiceSessionIds);
        console.log(`총 ${practiceSessionIds.length}개 세션의 평가 결과 대기 중`);

        // AI 평가 완료를 대기하는 로직
        const { EvaluationResult } = require('../models');
        const maxRetries = 180; // 최대 3분
        const retryDelay = 1000; // 1초 간격
        
        // 평가 완료를 대기하는 함수
        const waitForEvaluations = async (practiceSessionIds) => {
            console.log('평가 결과 확인 시작...');
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                console.log(`평가 완료 확인 시도 ${attempt}/${maxRetries}`);
                
                const evaluationResults = await EvaluationResult.findAll({
                    where: { 
                        practiceSessionId: practiceSessionIds 
                    }
                });
                
                console.log(`평가 완료된 세션 수: ${evaluationResults.length}/${practiceSessionIds.length}`);
                
                // 모든 평가가 완료되었는지 확인
                if (evaluationResults.length === practiceSessionIds.length) {
                    console.log('🎉 모든 평가가 완료됨!');
                    return evaluationResults;
                }
                
                // 마지막 시도가 아니면 대기
                if (attempt < maxRetries) {
                    console.log(`${retryDelay}ms 대기 후 재시도`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
            
            // 시간 초과
            console.log('⏰ 평가 완료 대기 시간 초과');
            return null;
        };

        if (practiceSessionIds.length === 0) {
            console.log('평가할 세션이 없음');
            // 세션이 없는 경우 바로 완료 처리
            const updateTransaction = await sequelize.transaction();
            try {
                const sessionToUpdate = await MockExamSession.findOne({ 
                    where: { mockExamSessionId, userId },
                    transaction: updateTransaction
                });
                
                sessionToUpdate.status = 'completed';
                sessionToUpdate.endTime = new Date();
                sessionToUpdate.overallScore = 0;
                
                await sessionToUpdate.save({ transaction: updateTransaction });
                await updateTransaction.commit();
                
                return await getMockExamSession(mockExamSessionId, userId);
            } catch (updateError) {
                await updateTransaction.rollback();
                throw updateError;
            }
        }
        
        // 평가 결과 대기
        const evaluationResults = await waitForEvaluations(practiceSessionIds);
        
        if (!evaluationResults) {
            console.log('평가 완료 대기 시간 초과 - 에러 발생');
            throw new ApiError(400, 'M006_EVALUATIONS_PENDING', 'AI evaluations are taking longer than expected. Please wait a moment and try again.');
        }
        
        // 평가 결과를 매핑하여 점수 계산
        const evaluationMap = {};
        evaluationResults.forEach(result => {
            evaluationMap[result.practiceSessionId] = result;
        });
        
        let totalScore = 0;
        let completedCases = 0;
        
        for (let i = 0; i < updatedScenariosDetails.length; i++) {
            const caseDetails = updatedScenariosDetails[i];
            
            if (caseDetails.practiceSessionId && evaluationMap[caseDetails.practiceSessionId]) {
                const evaluationResult = evaluationMap[caseDetails.practiceSessionId];
                const score = evaluationResult.overallScore || 0;
                updatedScenariosDetails[i] = {
                    ...caseDetails,
                    score: score
                };
                totalScore += score;
                completedCases++;
                console.log(`증례 ${i + 1} (${caseDetails.name}) 점수: ${score}`);
            }
        }

        // 평균 점수 계산
        const overallScore = completedCases > 0 ? Math.round(totalScore / completedCases) : 0;
        console.log('최종 점수 계산:', { totalScore, completedCases, overallScore });

        // 모의고사 세션 완료 (새로운 트랜잭션)
        const updateTransaction = await sequelize.transaction();
        try {
            const sessionToUpdate = await MockExamSession.findOne({ 
                where: { mockExamSessionId, userId },
                transaction: updateTransaction
            });
            
            sessionToUpdate.status = 'completed';
            sessionToUpdate.endTime = new Date();
            sessionToUpdate.overallScore = overallScore;
            sessionToUpdate.selectedScenariosDetails = updatedScenariosDetails;

            await sessionToUpdate.save({ transaction: updateTransaction });
            console.log('🎉 모의고사 세션 완료 및 저장됨');

            await updateTransaction.commit();
            console.log('모의고사 세션 업데이트 트랜잭션 커밋 완료');
        } catch (updateError) {
            await updateTransaction.rollback();
            throw updateError;
        }
        
        // 세션 완료 후 즉시 조회하여 최신 상태 확인
        const completedSession = await MockExamSession.findOne({ 
            where: { mockExamSessionId, userId } 
        });
        
        if (!completedSession) {
            console.log('완료된 세션을 조회할 수 없음 - 에러 발생');
            throw new ApiError(500, 'M005_SESSION_SAVE_ERROR', 'Failed to save completed session.');
        }
        
        console.log('완료된 세션 조회 성공');
        const result = completedSession.toJSON();
        console.log('반환할 결과:', result);
        return result;
        
    } catch (error) {
        console.log(`에러 발생: ${error.message}`);
        throw error;
    }
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

// 중분류 목록을 가져오는 함수 추가
const getCases = async () => {
    const scenarios = await Scenario.findAll({
        attributes: ['scenarioId', 'name', 'primaryCategory', 'secondaryCategory'],
        order: [['primaryCategory', 'ASC'], ['secondaryCategory', 'ASC'], ['name', 'ASC']]
    });
    
    const casesByPrimary = scenarios.reduce((acc, scenario) => {
        if (!acc[scenario.primaryCategory]) {
            acc[scenario.primaryCategory] = [];
        }
        acc[scenario.primaryCategory].push({
            scenarioId: scenario.scenarioId,
            name: scenario.name,
            secondaryCategory: scenario.secondaryCategory
        });
        return acc;
    }, {});
    
    return casesByPrimary;
};

module.exports = {
  startMockExamSession,
  getMockExamSession,
  completeMockExamSession,
  startCasePracticeSession,
  getCases
};