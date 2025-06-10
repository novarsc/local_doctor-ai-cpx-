/**
 * @file cases.routes.js
 * @description Defines API routes for scenarios (cases).
 */

const express = require('express');
const caseController = require('../../controllers/case.controller');
// 1. 인증 미들웨어를 가져옵니다.
const { verifyToken } = require('../../middlewares/auth.middleware');

const router = express.Router();

// 'GET' 요청은 로그아웃 상태에서도 볼 수 있으므로 미들웨어를 적용하지 않습니다.
router.get('/', caseController.getAllScenarios);
router.get('/:scenarioId', caseController.getScenarioById);

// 'POST', 'DELETE'는 반드시 로그인한 사용자만 가능해야 합니다.
// 2. verifyToken 미들웨어를 추가하여 아래 라우트들을 보호합니다.
router.post('/:scenarioId/bookmark', verifyToken, caseController.addBookmark);
router.delete('/:scenarioId/bookmark', verifyToken, caseController.removeBookmark);

module.exports = router;
