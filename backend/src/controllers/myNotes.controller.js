/**
 * @file myNotes.controller.js
 * @description Controller for "MY 노트" related API requests.
 */

const myNotesService = require('../services/myNotes.service');
const asyncHandler = require('../middlewares/asyncHandler.middleware');

const getBookmarks = asyncHandler(async (req, res) => {
    // 하드코딩된 ID 대신, 미들웨어가 넣어준 실제 사용자 ID를 사용합니다.
    const userId = req.user.userId;
    const bookmarkedScenarios = await myNotesService.getBookmarkedScenarios(userId);
    res.status(200).json({ data: bookmarkedScenarios });
});

const getIncorrectNotes = asyncHandler(async (req, res) => {
    const { scenarioId } = req.params;
    const userId = req.user.userId; // 실제 사용자 ID 사용
    const notes = await myNotesService.getIncorrectNotesForScenario(userId, scenarioId);
    res.status(200).json(notes);
});

const saveIncorrectNoteMemo = asyncHandler(async (req, res) => {
    const { scenarioId } = req.params;
    const { userMemo } = req.body;
    const userId = req.user.userId; // 실제 사용자 ID 사용
    const savedNote = await myNotesService.upsertUserIncorrectNote(userId, scenarioId, userMemo);
    res.status(200).json(savedNote);
});

const getHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId; // 실제 사용자 ID 사용
    const history = await myNotesService.getLearningHistory(userId);
    res.status(200).json({ data: history });
});

module.exports = {
    getBookmarks,
    getIncorrectNotes,
    saveIncorrectNoteMemo,
    getHistory,
};
