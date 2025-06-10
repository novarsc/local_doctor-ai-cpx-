/**
 * @file case.service.js
 * @description Business logic for handling scenarios (cases).
 */

const { Scenario, UserBookmarkedScenario } = require('../models');
const { Op } = require('sequelize');

const listScenarios = async (queryParams) => {
  // ... (이 함수는 기존과 동일합니다)
  const { page = 1, limit = 9, keyword, sortBy = 'createdAt_desc' } = queryParams;
  const offset = (page - 1) * limit;
  let where = {};
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword}%` } },
      { primaryCategory: { [Op.iLike]: `%${keyword}%` } },
      { secondaryCategory: { [Op.iLike]: `%${keyword}%` } },
    ];
  }
  const [sortField, sortOrder] = sortBy.split('_');
  const order = [[sortField, sortOrder.toUpperCase()]];
  const { count, rows } = await Scenario.findAndCountAll({
    where,
    limit,
    offset,
    attributes: [
      'scenarioId', 'name', 'primaryCategory', 'secondaryCategory', 'age', 'sex', 'shortDescription',
    ],
    order,
  });
  const totalPages = Math.ceil(count / limit);
  return {
    data: rows,
    pagination: {
      totalItems: count, totalPages, currentPage: parseInt(page, 10), pageSize: parseInt(limit, 10), hasNextPage: page < totalPages, hasPrevPage: page > 1,
    }
  };
};

const getScenarioById = async (scenarioId) => {
  // ... (이 함수는 기존과 동일합니다)
  const scenario = await Scenario.findByPk(scenarioId);
  if (!scenario) {
    return null;
  }
  return scenario.toJSON();
};

/**
 * 북마크 추가를 위한 서비스 함수입니다.
 * 디버깅을 위해 try...catch와 console.log를 추가합니다.
 * @param {string} userId - 현재 사용자의 ID
 * @param {string} scenarioId - 북마크할 증례의 ID
 * @returns {Promise<object>} 생성 또는 업데이트된 북마크 객체
 */
const addBookmark = async (userId, scenarioId) => {
  // --- 1. 디버깅 코드 시작 ---
  console.log(`[DEBUG] addBookmark 서비스 함수가 호출되었습니다.`);
  console.log(`[DEBUG] 전달된 인수 - userId: ${userId}, scenarioId: ${scenarioId}`);
  
  try {
    const [bookmark, created] = await UserBookmarkedScenario.upsert({
      userId: userId,
      scenarioId: scenarioId,
    });
    
    console.log(`[DEBUG] upsert 작업 결과:`, { bookmark: bookmark.toJSON(), created: created });
    return bookmark;

  } catch (error) {
    // 에러 발생 시, 전체 에러 객체를 콘솔에 출력합니다.
    console.error('[DEBUG] addBookmark 함수에서 심각한 오류 발생:', error);
    // 에러를 다시 던져서 상위 핸들러가 처리하도록 합니다.
    throw error;
  }
  // --- 디버깅 코드 끝 ---
};

/**
 * 북마크 삭제를 위한 서비스 함수입니다.
 */
const removeBookmark = async (userId, scenarioId) => {
  const deletedCount = await UserBookmarkedScenario.destroy({
    where: { userId, scenarioId }
  });
  return deletedCount;
};

module.exports = {
  listScenarios,
  getScenarioById,
  addBookmark,
  removeBookmark,
};
