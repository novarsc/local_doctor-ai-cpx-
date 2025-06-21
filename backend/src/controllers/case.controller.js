/**
 * @file case.controller.js
 * @description Controller for handling scenario (case) related API requests.
 */

const caseService = require('../services/case.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// getAllScenarios, getScenarioById 함수는 기존과 동일합니다.
const getAllScenarios = asyncHandler(async (req, res) => {
  const result = await caseService.listScenarios(req.query);
  res.status(200).json(result);
});

const getScenarioById = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  const scenarioDetails = await caseService.getScenarioById(scenarioId);
  if (!scenarioDetails) {
    return res.status(404).json({ message: 'Scenario not found' });
  }
  res.status(200).json(scenarioDetails);
});

// [추가] 카테고리 목록 조회를 위한 컨트롤러 함수
const getCaseCategories = asyncHandler(async (req, res) => {
  const categories = await caseService.fetchDistinctCategories();
  res.status(200).json({
    message: '성공적으로 카테고리 목록을 조회했습니다.',
    data: categories,
  });
});

/**
 * Handles the request to add a bookmark.
 */
const addBookmark = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  // 하드코딩된 ID 대신, 미들웨어가 넣어준 실제 사용자 ID를 사용합니다.
  const userId = req.user.userId;
  
  await caseService.addBookmark(userId, scenarioId);
  res.status(201).json({ message: 'Bookmark added successfully.' });
});

/**
 * Handles the request to remove a bookmark.
 */
const removeBookmark = asyncHandler(async (req, res) => {
    const { scenarioId } = req.params;
    // 하드코딩된 ID 대신, 미들웨어가 넣어준 실제 사용자 ID를 사용합니다.
    const userId = req.user.userId;

    await caseService.removeBookmark(userId, scenarioId);
    res.status(200).json({ message: 'Bookmark removed successfully.' });
});


module.exports = {
  getAllScenarios,
  getScenarioById,
  getCaseCategories,
  addBookmark,
  removeBookmark,
};
