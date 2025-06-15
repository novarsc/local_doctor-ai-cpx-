// backend/src/api/v1/dashboard.routes.js

const express = require('express');
// auth.middleware에서 verifyToken 함수를 직접 추출합니다.
const { verifyToken } = require('../../middlewares/auth.middleware');
const dashboardController = require('../../controllers/dashboard.controller');

const router = express.Router();

// GET /api/v1/dashboard/summary
router.get('/summary', verifyToken, dashboardController.getDashboardSummary);

module.exports = router;