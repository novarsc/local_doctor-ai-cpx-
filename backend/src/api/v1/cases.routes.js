/**
 * @file cases.routes.js
 * @description Defines API routes for scenarios (cases).
 */

const express = require('express');
const caseController = require('../../controllers/case.controller');
// const authMiddleware = require('../../middlewares/auth.middleware'); // To protect routes

const router = express.Router();

// All routes in this file will be protected by the auth middleware.
// router.use(authMiddleware);

// GET /api/v1/scenarios - Get a list of scenarios
router.get('/', caseController.getAllScenarios);

// GET /api/v1/scenarios/:scenarioId - Get details of a specific scenario
router.get('/:scenarioId', caseController.getScenarioById);

module.exports = router;
