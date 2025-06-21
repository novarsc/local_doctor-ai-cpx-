/**
 * @file user.service.js
 * @description Business logic for user-related operations.
 */

const { User, UserPracticeHistory, Scenario, sequelize } = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

/**
 * Fetches a user's profile by their ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object>} The user object without the password.
 */
const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    // 보안을 위해 password 필드는 제외하고 조회합니다.
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }
  return user.toJSON();
};


// --- [추가된 부분] ---
/**
 * 사용자의 학습 통계를 계산하여 반환합니다.
 * @param {string} userId - 통계를 계산할 사용자의 ID
 * @returns {Promise<object>}
 */
const calculateUserStats = async (userId) => {
  // 1. 총 학습 시간 계산 (분 단위)
  const practiceHistories = await UserPracticeHistory.findAll({
    where: { userId, endTime: { [Op.ne]: null } },
    attributes: ['startTime', 'endTime'],
  });

  const totalStudyMilliseconds = practiceHistories.reduce((total, history) => {
    // endTime과 startTime이 유효한 Date 객체인지 확인
    if (history.endTime && history.startTime) {
      return total + (new Date(history.endTime) - new Date(history.startTime));
    }
    return total;
  }, 0);
  const totalStudyMinutes = Math.round(totalStudyMilliseconds / (1000 * 60));

  // 2. 완료 증례 수 계산
  const [completedCasesCount, totalCasesCount] = await Promise.all([
    UserPracticeHistory.count({
      where: { userId },
      distinct: true,
      col: 'scenarioId',
    }),
    Scenario.count(),
  ]);
  
  // 3. 전체 평균 점수 계산
  const avgScoreResult = await UserPracticeHistory.findOne({
    where: { userId, score: { [Op.ne]: null } },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
    ],
    raw: true,
  });
  const overallAverageScore = avgScoreResult.averageScore
    ? Math.round(avgScoreResult.averageScore)
    : 0;

  // 4. 분류별 성취도 계산
  const performanceByCategory = await UserPracticeHistory.findAll({
    where: { userId, score: { [Op.ne]: null } },
    attributes: [
      [sequelize.col('scenario.primaryCategory'), 'category'], // 조인된 테이블의 컬럼명 사용
      [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
    ],
    include: [
      {
        model: Scenario,
        as: 'scenario', // 모델 관계 설정에 정의된 alias 사용
        attributes: [], // Scenario의 다른 필드는 가져오지 않음
      },
    ],
    group: [sequelize.col('scenario.primaryCategory')],
    raw: true,
  });

  return {
    totalStudyMinutes,
    completedCases: {
      count: completedCasesCount,
      total: totalCasesCount,
    },
    overallAverageScore,
    performanceByCategory: performanceByCategory.map(item => ({
      ...item,
      averageScore: Math.round(item.averageScore),
    })),
  };
};
// --- [여기까지 추가] ---


module.exports = {
  getUserProfile,
  calculateUserStats, // 추가
};