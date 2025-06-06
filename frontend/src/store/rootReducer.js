/**
 * @file rootReducer.js
 * @description Combines all reducers into a single root reducer.
 */

import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import caseReducer from './slices/caseSlice';
import practiceSessionReducer from './slices/practiceSessionSlice';
import mockExamReducer from './slices/mockExamSlice';
import myNotesReducer from './slices/myNotesSlice'; // Newly added reducer for my-notes

const rootReducer = combineReducers({
  auth: authReducer,
  cases: caseReducer,
  practiceSession: practiceSessionReducer,
  mockExam: mockExamReducer,
  myNotes: myNotesReducer, // Added my-notes state to the root reducer
});

export default rootReducer;
