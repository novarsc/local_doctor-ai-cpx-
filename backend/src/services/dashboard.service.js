// backend/src/services/dashboard.service.js

const { User, PracticeSession, EvaluationResult, Scenario, sequelize } = require('../models');
const { Op } = require('sequelize');

const dashboardService = {};

// 월간 평균 점수 추이 데이터 계산 함수
const calculateScoreTrendData = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const evaluations = await EvaluationResult.findAll({
    include: [{
      model: PracticeSession,
      as: 'practiceSession',
      where: { 
        userId,
        endTime: { [Op.gte]: sixMonthsAgo }
      },
      attributes: ['endTime']
    }],
    attributes: ['overallScore'],
    order: [[{ model: PracticeSession, as: 'practiceSession' }, 'endTime', 'ASC']]
  });

  // 월별로 데이터 그룹화
  const monthlyData = {};
  evaluations.forEach(eval => {
    const month = eval.practiceSession.endTime.toISOString().slice(0, 7); // YYYY-MM 형식
    if (!monthlyData[month]) {
      monthlyData[month] = { scores: [], count: 0 };
    }
    monthlyData[month].scores.push(eval.overallScore);
    monthlyData[month].count++;
  });

  // 최근 6개월 데이터 생성
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    const monthLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    
    if (monthlyData[monthKey]) {
      const avgScore = Math.round(monthlyData[monthKey].scores.reduce((a, b) => a + b, 0) / monthlyData[monthKey].scores.length);
      result.push({ month: monthLabel, score: avgScore });
    } else {
      result.push({ month: monthLabel, score: 0 });
    }
  }

  return result;
};

// 월간 완료 사례 수 데이터 계산 함수
const calculateMonthlyCompletionData = async (userId) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const practiceSessions = await PracticeSession.findAll({
    where: { 
      userId,
      status: 'completed',
      endTime: { [Op.gte]: sixMonthsAgo }
    },
    attributes: ['endTime'],
    order: [['endTime', 'ASC']]
  });

  // 월별로 완료 수 계산
  const monthlyCompletions = {};
  practiceSessions.forEach(session => {
    const month = session.endTime.toISOString().slice(0, 7); // YYYY-MM 형식
    monthlyCompletions[month] = (monthlyCompletions[month] || 0) + 1;
  });

  // 최근 6개월 데이터 생성
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().slice(0, 7);
    const monthLabel = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    
    result.push({ 
      month: monthLabel, 
      completed: monthlyCompletions[monthKey] || 0 
    });
  }

  return result;
};

// 학습성과요약 계산 함수
const calculateLearningPerformance = async (userId) => {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay()); // 이번 주 시작
  thisWeekStart.setHours(0, 0, 0, 0);
  
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // 이번 주 데이터
  const thisWeekSessions = await PracticeSession.findAll({
    where: { 
      userId,
      status: 'completed',
      endTime: { [Op.gte]: thisWeekStart }
    },
    include: [{ model: EvaluationResult, as: 'evaluationResult' }]
  });
  
  // 이번 달 데이터
  const thisMonthSessions = await PracticeSession.findAll({
    where: { 
      userId,
      status: 'completed',
      endTime: { [Op.gte]: thisMonthStart }
    },
    include: [{ model: EvaluationResult, as: 'evaluationResult' }]
  });
  
  // 지난 달 데이터 (비교용)
  const lastMonthSessions = await PracticeSession.findAll({
    where: { 
      userId,
      status: 'completed',
      endTime: { [Op.gte]: lastMonthStart, [Op.lt]: thisMonthStart }
    },
    include: [{ model: EvaluationResult, as: 'evaluationResult' }]
  });
  
  // evaluationResult가 있는 세션만 필터링
  const thisWeekSessionsWithScore = thisWeekSessions.filter(session => session.evaluationResult);
  const thisMonthSessionsWithScore = thisMonthSessions.filter(session => session.evaluationResult);
  const lastMonthSessionsWithScore = lastMonthSessions.filter(session => session.evaluationResult);

  return {
    thisWeek: {
      completedCases: thisWeekSessions.length,
      averageScore: thisWeekSessionsWithScore.length > 0 
        ? Math.round(thisWeekSessionsWithScore.reduce((sum, session) => sum + session.evaluationResult.overallScore, 0) / thisWeekSessionsWithScore.length)
        : 0,
      totalTime: thisWeekSessions.reduce((sum, session) => {
        if (session.startTime && session.endTime) {
          return sum + Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60));
        }
        return sum;
      }, 0)
    },
    thisMonth: {
      completedCases: thisMonthSessions.length,
      averageScore: thisMonthSessionsWithScore.length > 0 
        ? Math.round(thisMonthSessionsWithScore.reduce((sum, session) => sum + session.evaluationResult.overallScore, 0) / thisMonthSessionsWithScore.length)
        : 0,
      totalTime: thisMonthSessions.reduce((sum, session) => {
        if (session.startTime && session.endTime) {
          return sum + Math.round((new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60));
        }
        return sum;
      }, 0)
    },
    improvement: {
      scoreChange: thisMonthSessionsWithScore.length > 0 && lastMonthSessionsWithScore.length > 0
        ? Math.round((thisMonthSessionsWithScore.reduce((sum, session) => sum + session.evaluationResult.overallScore, 0) / thisMonthSessionsWithScore.length) - 
                    (lastMonthSessionsWithScore.reduce((sum, session) => sum + session.evaluationResult.overallScore, 0) / lastMonthSessionsWithScore.length))
        : 0,
      caseChange: thisMonthSessions.length - lastMonthSessions.length
    }
  };
};

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

  // 3. 차트 데이터 및 학습성과요약 계산
  const [scoreTrendData, monthlyCompletionData, learningPerformance] = await Promise.all([
    calculateScoreTrendData(userId),
    calculateMonthlyCompletionData(userId),
    calculateLearningPerformance(userId)
  ]);

  // 4. 누적 대화 시간 계산
  const completedSessions = await PracticeSession.findAll({
    where: { 
      userId,
      status: 'completed',
      endTime: { [Op.not]: null }
    },
    attributes: ['startTime', 'endTime']
  });

  let totalConversationMinutes = 0;
  completedSessions.forEach(session => {
    if (session.startTime && session.endTime) {
      const durationMs = new Date(session.endTime) - new Date(session.startTime);
      const durationMinutes = Math.round(durationMs / (1000 * 60)); // 밀리초를 분으로 변환
      totalConversationMinutes += durationMinutes;
    }
  });

  // 5. 최종 데이터 조합
  if (evaluations.length === 0) {
    return {
      user: { name: user ? user.nickname : '사용자' },
      stats: [
        { id: 'completed_cases', icon: 'school', label: "완료한 사례", value: 0, unit: "건" },
        { id: 'avg_score', icon: 'star_outline', label: "평균 점수", value: 0, unit: "점" },
        { id: 'total_time', icon: 'timer', label: "누적 대화 시간", value: 0, unit: "분" },
      ],
      lastActivity: null,
      scoreTrendData: scoreTrendData,
      monthlyCompletionData: monthlyCompletionData,
      ongoingCase: ongoingCase,
      insights: null,
      recommendedCases: recommendedCases, // 풀어본 기록이 없어도 추천은 가능
      weeklyGoal: null,
      learningTip: null,
      learningPerformance: learningPerformance
    };
  }

  const completedCasesCount = evaluations.length;
  const totalScore = evaluations.reduce((sum, eval) => sum + eval.overallScore, 0);
  const averageScore = Math.round(totalScore / completedCasesCount);
  const lastActivity = {
    caseTitle: evaluations[0].practiceSession.scenario.name,
    date: evaluations[0].practiceSession.endTime.toISOString().split('T')[0],
    scenarioId: evaluations[0].practiceSession.scenarioId
  };

  const summaryData = {
    user: { name: user.nickname },
    stats: [
        { id: 'completed_cases', icon: 'school', label: "완료한 사례", value: completedCasesCount, unit: "건" },
        { id: 'avg_score', icon: 'star_outline', label: "평균 점수", value: averageScore, unit: "점" },
        { id: 'total_time', icon: 'timer', label: "누적 대화 시간", value: totalConversationMinutes, unit: "분" },
    ],
    lastActivity: lastActivity,
    scoreTrendData: scoreTrendData,
    monthlyCompletionData: monthlyCompletionData,
    ongoingCase: ongoingCase,
    insights: null,
    recommendedCases: recommendedCases, // 계산된 추천 사례로 교체
    weeklyGoal: null,
    learningTip: null,
    learningPerformance: learningPerformance
  };

  return summaryData;
};

module.exports = dashboardService;