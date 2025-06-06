/**
 * @file case.controller.js
 * @description Controller for handling scenario (case) related API requests.
 */

const caseService = require('../services/case.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

/**
 * Handles the request to get a list of all scenarios.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getAllScenarios = asyncHandler(async (req, res) => {
  // Assuming an authentication middleware has added the user object to the request.
  // const userId = req.user.userId;
  const userId = 'placeholder-user-id'; // Using a placeholder for now.
  
  const result = await caseService.listScenarios(req.query, userId);
  
  res.status(200).json(result);
});

/**
 * Handles the request to get details for a specific scenario.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getScenarioById = asyncHandler(async (req, res) => {
  const { scenarioId } = req.params;
  // Assuming an authentication middleware has added the user object to the request.
  // const userId = req.user.userId;
  const userId = 'placeholder-user-id'; // Using a placeholder for now.

  const scenarioDetails = await caseService.getScenarioById(scenarioId, userId);

  res.status(200).json(scenarioDetails);
});


module.exports = {
  getAllScenarios,
  getScenarioById,
};
