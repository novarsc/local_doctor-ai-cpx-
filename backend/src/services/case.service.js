/**
 * @file case.service.js
 * @description Business logic for handling scenarios (cases).
 */

const { Scenario, UserBookmarkedScenario, UserPracticeHistory } = require('../models');
const { Op, Sequelize } = require('sequelize');

const listScenarios = async (queryParams, userId = null) => {
  const { page = 1, limit = 1000, search, category, status, sortBy = 'createdAt_desc' } = queryParams;
  let where = {};
  
  console.log('[DEBUG] listScenarios called with:', { queryParams, userId });
  
  // 검색어 필터링 (search 파라미터)
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { primaryCategory: { [Op.iLike]: `%${search}%` } },
      { secondaryCategory: { [Op.iLike]: `%${search}%` } },
      { shortDescription: { [Op.iLike]: `%${search}%` } },
    ];
  }
  
  // 카테고리 필터링 (category 파라미터)
  if (category) {
    // 쉼표로 구분된 카테고리들을 배열로 분리
    const categoryArray = category.split(',').map(cat => cat.trim()).filter(cat => cat);
    
    if (categoryArray.length > 0) {
      where.primaryCategory = { [Op.in]: categoryArray };
    }
  }
  
  const [sortField, sortOrder] = sortBy.split('_');
  const order = [[sortField, sortOrder.toUpperCase()]];
  
  // 상태 필터링 (status 파라미터) - 사용자 ID가 있을 때만 적용
  if (userId && status && status !== 'all') {
    console.log('[DEBUG] Applying status filter:', { status, userId });
    
    if (status === 'completed') {
      // 완료된 증례만: UserPracticeHistory에 기록이 있는 증례
      const completedScenarioIds = await UserPracticeHistory.findAll({
        where: { userId },
        attributes: ['scenarioId'],
        raw: true
      });
      
      const completedIds = completedScenarioIds.map(item => item.scenarioId);
      console.log('[DEBUG] Completed scenario IDs:', completedIds);
      
      if (completedIds.length > 0) {
        where.scenarioId = { [Op.in]: completedIds };
      } else {
        // 완료된 증례가 없으면 빈 결과 반환
        where.scenarioId = { [Op.in]: [] };
      }
    } else if (status === 'incomplete') {
      // 미완료 증례만: UserPracticeHistory에 기록이 없는 증례
      const completedScenarioIds = await UserPracticeHistory.findAll({
        where: { userId },
        attributes: ['scenarioId'],
        raw: true
      });
      
      const completedIds = completedScenarioIds.map(item => item.scenarioId);
      console.log('[DEBUG] Completed scenario IDs:', completedIds);
      
      if (completedIds.length > 0) {
        where.scenarioId = { [Op.notIn]: completedIds };
      }
    } else if (status === 'bookmarked') {
      // 즐겨찾기된 증례만: UserBookmarkedScenario에 기록이 있는 증례
      const bookmarkedScenarioIds = await UserBookmarkedScenario.findAll({
        where: { userId },
        attributes: ['scenarioId'],
        raw: true
      });
      
      const bookmarkedIds = bookmarkedScenarioIds.map(item => item.scenarioId);
      console.log('[DEBUG] Bookmarked scenario IDs:', bookmarkedIds);
      
      if (bookmarkedIds.length > 0) {
        where.scenarioId = { [Op.in]: bookmarkedIds };
      } else {
        // 즐겨찾기된 증례가 없으면 빈 결과 반환
        where.scenarioId = { [Op.in]: [] };
      }
    }
  }
  
  console.log('[DEBUG] Final query options:', { where });
  
  const { count, rows } = await Scenario.findAndCountAll({
    where,
    limit,
    attributes: [
      'scenarioId', 'name', 'primaryCategory', 'secondaryCategory', 'age', 'sex', 'shortDescription',
    ],
    order,
  });
  
  console.log('[DEBUG] Query result:', { count, rowsCount: rows.length });
  
  return {
    data: rows,
    pagination: {
      totalItems: count, 
      totalPages: 1, 
      currentPage: 1, 
      pageSize: count, 
      hasNextPage: false, 
      hasPrevPage: false,
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

// [추가] 중복 없는 카테고리 목록을 조회하는 서비스 함수
const fetchDistinctCategories = async () => {
  const categories = await Scenario.findAll({
    attributes: [
      // 'primaryCategory' 컬럼에서 중복을 제거하고 오름차순으로 정렬하여 가져옵니다.
      [Sequelize.fn('DISTINCT', Sequelize.col('primaryCategory')), 'category']
    ],
    where: {
      primaryCategory: {
        [Op.ne]: null // NULL 값은 제외합니다.
      }
    },
    order: [[Sequelize.col('category'), 'ASC']],
  });

  // [{ category: '내과' }, { category: '외과' }] 형태의 배열을
  // ['내과', '외과'] 형태로 변환하여 반환합니다.
  return categories.map(item => item.get('category'));
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
  fetchDistinctCategories,
  addBookmark,
  removeBookmark,
};
