// backend/src/services/dashboard.service.js

const { User, PracticeSession, EvaluationResult, Scenario, sequelize } = require('../models');
const { Op } = require('sequelize');

const dashboardService = {};

dashboardService.getDashboardSummary = async (userId) => {
  // 1. 진행 중인 사례 조회
  const ongoingSession = await PracticeSession.findOne({
    where: { userId, status: 'started' },
    include: [{ model: Scenario, as: 'scenario', attributes: ['scenarioId', 'name', 'shortDescription'] }],
    order: [['startTime', 'DESC']]
  });

 const ongoingCase = ongoingSession ? {
    practiceSessionId: ongoingSession.practiceSessionId, // practiceSessionId 추가
    scenarioId: ongoingSession.scenario.scenarioId,     // id를 scenarioId로 명확하게 변경
    title: ongoingSession.scenario.name,
    desc: ongoingSession.scenario.shortDescription,
    img: `https://placehold.co/400x225/E2E8F0/4A5568?text=In+Progress`,
    progress: 0 
  } : null;
  
  // 2. 사용자 정보 및 전체 평가 기록 조회
  const user = await User.findByPk(userId, { attributes: ['nickname'] });
  const evaluations = await EvaluationResult.findAll({
    include: [{
      model: PracticeSession,
      as: 'practiceSession',
      where: { userId },
      attributes: ['endTime', 'scenarioId'],
      include: [{ model: Scenario, as: 'scenario', attributes: ['name'] }]
    }],
    order: [[{ model: PracticeSession, as: 'practiceSession' }, 'endTime', 'DESC']]
  });

  // --- 추천 사례 로직 구현 ---
  const RECOMMENDATION_THRESHOLD_SCORE = 85;
  const RECOMMENDATION_COUNT = 3;
  let recommendedCases = [];

  if (evaluations.length > 0) {
    const allScenarios = await Scenario.findAll({ raw: true });
    const practicedScenarios = new Map();

    evaluations.forEach(e => {
      const scenarioId = e.practiceSession.scenarioId;
      const score = e.overallScore;
      if (!practicedScenarios.has(scenarioId) || practicedScenarios.get(scenarioId) < score) {
        practicedScenarios.set(scenarioId, score);
      }
    });

    let recommendationPool = [];
    allScenarios.forEach(scenario => {
      const scenarioId = scenario.scenarioId;
      if (!practicedScenarios.has(scenarioId)) {
        recommendationPool.push({ ...scenario, reason: "아직 학습하지 않은 새로운 유형의 사례입니다." });
      } else if (practicedScenarios.get(scenarioId) < RECOMMENDATION_THRESHOLD_SCORE) {
        recommendationPool.push({ ...scenario, reason: `이전 최고 점수(${practicedScenarios.get(scenarioId)}점)를 넘어보세요!` });
      }
    });
    
    const shuffledPool = recommendationPool.sort(() => 0.5 - Math.random());
    const selectedRecommendations = shuffledPool.slice(0, RECOMMENDATION_COUNT);

    recommendedCases = selectedRecommendations.map(s => ({
        id: s.scenarioId,
        title: s.name,
        desc: s.shortDescription,
        img: `https://placehold.co/400x225/E2E8F0/4A5568?text=${encodeURIComponent(s.name)}`,
        reason: s.reason
    }));
  }
  // --- 추천 사례 로직 끝 ---


  // 3. 최종 데이터 조합
  if (evaluations.length === 0) {
    return {
      user: { name: user ? user.nickname : '사용자' },
      stats: [
        { id: 'completed_cases', icon: 'school', label: "완료한 사례", value: 0, unit: "건" },
        { id: 'avg_score', icon: 'star_outline', label: "평균 점수", value: 0, unit: "점" },
        { id: 'avg_time', icon: 'timer', label: "평균 대화 시간", value: 0, unit: "분" },
      ],
      lastActivity: null,
      scoreTrendData: [],
      monthlyCompletionData: [],
      ongoingCase: ongoingCase,
      insights: null,
      recommendedCases: recommendedCases, // 풀어본 기록이 없어도 추천은 가능
      weeklyGoal: null,
      learningTip: null
    };
  }

  const completedCasesCount = evaluations.length;
  const totalScore = evaluations.reduce((sum, eval) => sum + eval.overallScore, 0);
  const averageScore = Math.round(totalScore / completedCasesCount);
  const lastActivity = {
    caseTitle: evaluations[0].practiceSession.scenario.name,
    date: evaluations[0].practiceSession.endTime.toISOString().split('T')[0]
  };

  const summaryData = {
    user: { name: user.nickname },
    stats: [
        { id: 'completed_cases', icon: 'school', label: "완료한 사례", value: completedCasesCount, unit: "건" },
        { id: 'avg_score', icon: 'star_outline', label: "평균 점수", value: averageScore, unit: "점" },
        { id: 'avg_time', icon: 'timer', label: "평균 대화 시간", value: 8, unit: "분" },
    ],
    lastActivity: lastActivity,
    scoreTrendData: [], // 차트 데이터는 별도 구현 필요
    monthlyCompletionData: [], // 차트 데이터는 별도 구현 필요
    ongoingCase: ongoingCase,
    insights: null,
    recommendedCases: recommendedCases, // 계산된 추천 사례로 교체
    weeklyGoal: null,
    learningTip: null
  };

  return summaryData;
};

module.exports = dashboardService;