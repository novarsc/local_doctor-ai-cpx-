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
        age: s.age,
        sex: s.sex,
        presentingComplaint: s.presentingComplaint,
        bloodPressure: s.bloodPressure,
        pulse: s.pulse,
        respiration: s.respiration,
        temperature: s.temperature,
        description: s.description,
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
    
    // 환자 정보가 없는 경우 증례 정보를 다시 조회하여 추가
    const sessionData = session.toJSON();
    if (sessionData.selectedScenariosDetails && sessionData.selectedScenariosDetails.length > 0) {
        const firstCase = sessionData.selectedScenariosDetails[0];
        if (!firstCase.age && !firstCase.presentingComplaint) {
            console.log('환자 정보가 없어 증례 정보를 다시 조회합니다.');
            
            // 모든 증례 정보를 다시 조회
            const scenarioIds = sessionData.selectedScenariosDetails.map(caseDetail => caseDetail.scenarioId);
            const scenarios = await Scenario.findAll({
                where: { scenarioId: scenarioIds }
            });
            
            const scenariosMap = scenarios.reduce((acc, scenario) => {
                acc[scenario.scenarioId] = scenario;
                return acc;
            }, {});
            
            // 환자 정보 추가
            sessionData.selectedScenariosDetails = sessionData.selectedScenariosDetails.map(caseDetail => {
                const scenario = scenariosMap[caseDetail.scenarioId];
                if (scenario) {
                    return {
                        ...caseDetail,
                        age: scenario.age,
                        sex: scenario.sex,
                        presentingComplaint: scenario.presentingComplaint,
                        bloodPressure: scenario.bloodPressure,
                        pulse: scenario.pulse,
                        respiration: scenario.respiration,
                        temperature: scenario.temperature,
                        description: scenario.description,
                    };
                }
                return caseDetail;
            });
        }
    }
    
    console.log('세션 조회 성공, 반환:', sessionData);
    return sessionData;
};

const completeMockExamSession = async (mockExamSessionId, userId) => {
    console.log('=== completeMockExamSession 호출 ===');
    console.log('mockExamSessionId:', mockExamSessionId);
    console.log('userId:', userId);
    
    // Sequelize 트랜잭션 시작
    const { sequelize } = require('../models');
    const transaction = await sequelize.transaction();
    
    try {
        const session = await MockExamSession.findOne({ 
            where: { mockExamSessionId, userId },
            transaction 
        });
        console.log('조회된 세션:', session ? '존재함' : '존재하지 않음');
        
        if (!session) {
            console.log('세션을 찾을 수 없음 - 에러 발생');
            await transaction.rollback();
            throw new ApiError(404, 'M002_MOCK_EXAM_SESSION_NOT_FOUND', 'Mock exam session not found.');
        }

        // 모든 실습 세션을 완료하고 점수를 계산
        const updatedScenariosDetails = [...session.selectedScenariosDetails];
        let totalScore = 0;
        let completedCases = 0;
        let hasPendingEvaluations = false;

        console.log('처리할 증례 수:', updatedScenariosDetails.length);

        for (let i = 0; i < updatedScenariosDetails.length; i++) {
            const caseDetails = updatedScenariosDetails[i];
            console.log(`증례 ${i + 1} 처리 중:`, caseDetails);
            
            if (caseDetails.practiceSessionId) {
                // 실습 세션 완료
                const practiceSession = await PracticeSession.findOne({
                    where: { practiceSessionId: caseDetails.practiceSessionId, userId },
                    transaction
                });
                
                console.log(`실습 세션 ${caseDetails.practiceSessionId}:`, practiceSession ? '존재함' : '존재하지 않음');
                
                if (practiceSession && practiceSession.status !== 'completed') {
                    // 실습 세션을 완료 상태로 변경
                    practiceSession.status = 'completed';
                    practiceSession.endTime = new Date();
                    await practiceSession.save({ transaction });
                    console.log('실습 세션을 완료 상태로 변경함');
                }
            } else {
                console.log(`증례 ${i + 1}에 실습 세션 ID가 없음`);
            }
        }

        // 트랜잭션 커밋 (실습 세션 완료)
        await transaction.commit();
        console.log('실습 세션 완료 트랜잭션 커밋 완료');

        // 트랜잭션 외부에서 평가 결과 조회 및 점수 계산
        console.log('트랜잭션 외부에서 평가 결과 조회 시작');
        
        for (let i = 0; i < updatedScenariosDetails.length; i++) {
            const caseDetails = updatedScenariosDetails[i];
            
            if (caseDetails.practiceSessionId) {
                // 평가 결과에서 점수 가져오기 (트랜잭션 외부에서 조회)
                const { EvaluationResult } = require('../models');
                const evaluationResult = await EvaluationResult.findOne({
                    where: { practiceSessionId: caseDetails.practiceSessionId }
                });
                
                console.log(`증례 ${i + 1} 평가 결과:`, evaluationResult ? '존재함' : '존재하지 않음');
                
                if (evaluationResult) {
                    const score = evaluationResult.overallScore || 0;
                    updatedScenariosDetails[i] = {
                        ...caseDetails,
                        score: score
                    };
                    totalScore += score;
                    completedCases++;
                    console.log(`증례 ${i + 1} 점수: ${score}`);
                } else {
                    // 평가 결과가 없는 경우
                    hasPendingEvaluations = true;
                    console.log(`증례 ${i + 1} 평가 결과 대기 중`);
                }
            }
        }

        // 평가가 완료되지 않은 경우가 있으면 에러 반환
        if (hasPendingEvaluations) {
            console.log('일부 평가가 완료되지 않음 - 에러 발생');
            throw new ApiError(400, 'M006_EVALUATIONS_PENDING', 'Some evaluations are still in progress. Please wait a moment and try again.');
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
            console.log('모의고사 세션 완료 및 저장됨');

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
        // 트랜잭션 롤백 (안전하게 처리)
        try {
            if (transaction && transaction.finished === undefined) {
                await transaction.rollback();
                console.log('트랜잭션 롤백 완료');
            }
        } catch (rollbackError) {
            console.log('트랜잭션 롤백 실패 (이미 완료됨):', rollbackError.message);
        }
        
        console.log('에러 발생:', error.message);
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