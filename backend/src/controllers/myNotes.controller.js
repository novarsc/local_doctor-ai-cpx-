/**
 * @file myNotes.controller.js
 * @description Controller for "MY 노트" related API requests.
 */

const myNotesService = require('../services/myNotes.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

// getBookmarks, getIncorrectNotes, saveIncorrectNoteMemo functions remain unchanged...
const getBookmarks = asyncHandler(async (req, res) => { const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; const bookmarkedScenarios = await myNotesService.getBookmarkedScenarios(userId); res.status(200).json({ data: bookmarkedScenarios }); });
const getIncorrectNotes = asyncHandler(async (req, res) => { const { scenarioId } = req.params; const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; const notes = await myNotesService.getIncorrectNotesForScenario(userId, scenarioId); res.status(200).json(notes); });
const saveIncorrectNoteMemo = asyncHandler(async (req, res) => { const { scenarioId } = req.params; const { userMemo } = req.body; const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; const savedNote = await myNotesService.upsertUserIncorrectNote(userId, scenarioId, userMemo); res.status(200).json(savedNote); });

/**
 * Handles the request to get the user's learning history.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
const getHistory = asyncHandler(async (req, res) => {
    const userId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Placeholder User ID
    const history = await myNotesService.getLearningHistory(userId);
    res.status(200).json({ data: history });
});

module.exports = {
    getBookmarks,
    getIncorrectNotes,
    saveIncorrectNoteMemo,
    getHistory,
};
