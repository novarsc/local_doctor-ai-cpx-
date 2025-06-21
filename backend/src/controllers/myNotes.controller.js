/**
 * @file myNotes.controller.js
 * @description Controller for "MY 노트" related API requests.
 */

const myNotesService = require('../services/myNotes.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

const getBookmarks = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const bookmarkedScenarios = await myNotesService.getBookmarkedScenarios(userId);
    res.status(200).json({ data: bookmarkedScenarios });
});

const getIncorrectNotes = asyncHandler(async (req, res) => {
    const { scenarioId } = req.params;
    const userId = req.user.userId;
    const notes = await myNotesService.getIncorrectNotesForScenario(userId, scenarioId);
    res.status(200).json(notes);
});

const saveIncorrectNoteMemo = asyncHandler(async (req, res) => {
    const { scenarioId } = req.params;
    const { userMemo } = req.body;
    const userId = req.user.userId;
    const savedNote = await myNotesService.upsertUserIncorrectNote(userId, scenarioId, userMemo);
    res.status(200).json(savedNote);
});

const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const history = await myNotesService.getLearningHistory(userId);
    res.status(200).json({ data: history });
});


// --- [추가된 부분] ---
/**
 * Handles the request to get the list of practiced scenarios.
 */
const getPracticedScenarios = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const scenarios = await myNotesService.getPracticedScenarios(userId);
    res.status(200).json(scenarios);
});
// --- [여기까지 추가] ---


module.exports = {
    getBookmarks,
    getIncorrectNotes,
    saveIncorrectNoteMemo,
    getHistory,
    getPracticedScenarios, // 추가
};