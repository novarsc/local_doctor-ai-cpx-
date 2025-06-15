// backend/src/controllers/dashboard.controller.js

const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

const dashboardController = {};

dashboardController.getDashboardSummary = asyncHandler(async (req, res) => {
  const summaryData = await dashboardService.getDashboardSummary(req.user.userId);
  res.status(200).json(summaryData);
});

module.exports = dashboardController;