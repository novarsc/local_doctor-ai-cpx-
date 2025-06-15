// backend/src/services/dashboard.service.js

const { User, PracticeSession, EvaluationResult, Scenario, sequelize } = require('../models');

const dashboardService = {};

dashboardService.getDashboardSummary = async (userId) => {
  // --- 1. 실제 DB에서 데이터 조회 (이 부분은 그대로 유지됩니다) ---
  const user = await User.findByPk(userId, { attributes: ['nickname'] });
  const evaluations = await EvaluationResult.findAll({
    include: [{
      model: PracticeSession,
      as: 'practiceSession',
      where: { userId },
      attributes: ['endTime', 'scenarioId']
    }],
    order: [[{ model: PracticeSession, as: 'practiceSession' }, 'endTime', 'DESC']]
  });
  // --- 여기까지 실제 DB 조회 ---


  // --- UI 완성을 위한 임시 가상(Mock) 데이터 ---
  // 실제 서비스에서는 이 데이터들도 DB 조회나 AI 분석을 통해 생성해야 합니다.
  const mockInsights = {
    learningTimeTrend: "지난 주보다 학습 시간이 15% 증가했어요! 꾸준히 발전하는 모습이 인상적입니다. 🚀",
    mostPracticedSystem: "지난 달에는 소화기계 사례를 가장 집중적으로 학습하셨네요.",
    improvementSummary: "최근 병력 청취 능력이 눈에 띄게 향상되었어요. 다만, 아직 신체 검진의 정확성이 조금 아쉬워요."
  };
  const mockRecommendedCases = [
    { id: 'f53063c1-51a9-4aca-a811-747ab3428b72', title: "사례 4: 흉통", desc: "다양한 흉통 원인을 진단하는 연습을 하세요.", img: `https://placehold.co/400x225/E2E8F0/4A5568?text=Case+4`, reason: "최근 심혈관계 사례 학습과 연관성이 높습니다." },
    { id: 'f53063c1-51a9-4aca-a811-747ab3428b72', title: "사례 5: 호흡 곤란", desc: "호흡 곤란과 관련된 사례를 해결하세요.", img: `https://placehold.co/400x225/E2E8F0/4A5568?text=Case+5`, reason: "호흡기계 진단 능력을 향상시킬 수 있습니다." },
  ];
  const mockScoreTrend = [
    { month: '1월', score: 78 }, { month: '2월', score: 82 }, { month: '3월', score: 80 },
    { month: '4월', score: 85 }, { month: '5월', score: 88 }, { month: '6월', score: 86 } 
  ];
  const mockCompletionTrend = [
      { month: '1월', completed: 5 }, { month: '2월', completed: 7 }, { month: '3월', completed: 6 },
      { month: '4월', completed: 8 }, { month: '5월', completed: 10 }, { month: '6월', completed: 9 }
  ];
  // --- 여기까지 임시 가상 데이터 ---


  // --- 2. 실제 데이터와 가상 데이터를 조합하여 최종 응답 생성 ---
  let summaryData;

  if (evaluations.length === 0) {
    // 평가 이력이 없는 사용자를 위한 기본값
    summaryData = { /* ... 기본값 설정 ... */ };
  } else {
    // --- 실제 통계 계산 (이 부분도 그대로 유지됩니다) ---
    const scenarioIds = evaluations.map(e => e.practiceSession.scenarioId);
    const scenarios = await Scenario.findAll({ where: { scenarioId: scenarioIds }, attributes: ['scenarioId', 'name'], raw: true });
    const scenariosMap = new Map(scenarios.map(s => [s.scenarioId, s.name]));
    
    const completedCasesCount = evaluations.length;
    const totalScore = evaluations.reduce((sum, eval) => sum + eval.overallScore, 0);
    const averageScore = Math.round(totalScore / completedCasesCount);
    
    const lastActivity = {
      caseTitle: scenariosMap.get(evaluations[0].practiceSession.scenarioId),
      date: evaluations[0].practiceSession.endTime.toISOString().split('T')[0]
    };
    // --- 여기까지 실제 통계 계산 ---

    // --- 최종 데이터 조합 ---
    summaryData = {
      user: { name: user.nickname },
      stats: [
        { id: 'completed_cases', icon: 'school', label: "완료한 사례", value: completedCasesCount, unit: "건" },
        { id: 'avg_score', icon: 'star_outline', label: "평균 점수", value: averageScore, unit: "점" },
        { id: 'avg_time', icon: 'timer', label: "평균 대화 시간", value: 8, unit: "분" },
      ],
      lastActivity,
      // 가상(Mock) 데이터를 여기에 할당합니다.
      insights: mockInsights,
      recommendedCases: mockRecommendedCases,
      scoreTrendData: mockScoreTrend,
      monthlyCompletionData: mockCompletionTrend,
      ongoingCase: null, // 진행 중인 사례는 없다고 가정
    };
  }

  return summaryData;
};

module.exports = dashboardService;