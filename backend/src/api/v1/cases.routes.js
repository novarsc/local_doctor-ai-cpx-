/**
 * @file cases.routes.js
 * @description Defines API routes for scenarios (cases).
 */

const express = require('express');
const caseController = require('../../controllers/case.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken, optionalAuth } = require('../../middlewares/auth.middleware');

const router = express.Router();

// [추가] 카테고리 목록을 가져오는 API 라우트
router.get('/categories', caseController.getCaseCategories);
// [추가] 대분류별 중분류 카테고리를 가져오는 API 라우트
router.get('/categories/:primaryCategory/subcategories', caseController.getSubCategories);

// 선택적 인증 미들웨어 적용 - 로그인하지 않아도 목록은 볼 수 있지만, 필터링은 로그인한 사용자만 가능
router.get('/', optionalAuth, caseController.getAllScenarios);
router.get('/:scenarioId', caseController.getScenarioById);

// 'POST', 'DELETE'는 반드시 로그인한 사용자만 가능해야 합니다.
// 2. verifyToken 미들웨어를 추가하여 아래 라우트들을 보호합니다.
router.post('/:scenarioId/bookmark', verifyToken, caseController.addBookmark);
router.delete('/:scenarioId/bookmark', verifyToken, caseController.removeBookmark);

module.exports = router;
