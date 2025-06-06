/**
 * @file myNotes.routes.js
 * @description Defines API routes for "MY 노트" features.
 */

const express = require('express');
const myNotesController = require('../../controllers/myNotes.controller');
// const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

// router.use(authMiddleware);

// --- Bookmarks ---
router.get('/bookmarks', myNotesController.getBookmarks);

// --- Incorrect Answer Notes ---
router.get('/incorrect-notes/:scenarioId', myNotesController.getIncorrectNotes);
router.put('/incorrect-notes/:scenarioId', myNotesController.saveIncorrectNoteMemo);

// --- Learning History ---
// GET /api/v1/my-notes/history
router.get('/history', myNotesController.getHistory);

module.exports = router;
