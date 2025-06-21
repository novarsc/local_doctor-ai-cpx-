/**
 * @file myNotesSlice.js
 * @description Redux Toolkit slice for managing "MY 노트" state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { myNotesService } from '../../services/myNotesService';

// --- [추가된 Thunk] ---
export const fetchPracticedScenarios = createAsyncThunk(
  'myNotes/fetchPracticedScenarios',
  async (_, { rejectWithValue }) => {
    try {
      const scenarios = await myNotesService.getPracticedScenarios();
      return scenarios;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// --- [여기까지 추가] ---

const initialState = {
  bookmarks: [],
  incorrectNotes: {},
  learningHistory: [],
  practicedScenarios: [], // 추가
  status: {
    bookmarks: 'idle',
    incorrectNotes: 'idle',
    learningHistory: 'idle',
    practicedScenarios: 'idle', // 추가
  },
  error: null,
};

// ... (기존의 다른 Thunk들)
export const fetchBookmarks = createAsyncThunk('myNotes/fetchBookmarks', async (_, { rejectWithValue }) => { try { return await myNotesService.getBookmarks(); } catch (e) { return rejectWithValue(e.message); }});
export const fetchIncorrectNotes = createAsyncThunk('myNotes/fetchIncorrectNotes', async (id, { rejectWithValue }) => { try { const d = await myNotesService.getIncorrectNotes(id); return { scenarioId: id, data: d }; } catch (e) { return rejectWithValue(e.message); }});
export const saveUserMemo = createAsyncThunk('myNotes/saveUserMemo', async ({ id, memo }, { rejectWithValue }) => { try { const d = await myNotesService.saveIncorrectNoteMemo(id, memo); return { scenarioId: id, data: d }; } catch (e) { return rejectWithValue(e.message); }});
export const fetchLearningHistory = createAsyncThunk('myNotes/fetchLearningHistory', async (_, { rejectWithValue }) => { try { return await myNotesService.getLearningHistory(); } catch (error) { return rejectWithValue(error.message); } } );


const myNotesSlice = createSlice({
  name: 'myNotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // [추가된 Reducer 로직]
      .addCase(fetchPracticedScenarios.pending, (state) => {
        state.status.practicedScenarios = 'loading';
      })
      .addCase(fetchPracticedScenarios.fulfilled, (state, action) => {
        state.status.practicedScenarios = 'succeeded';
        state.practicedScenarios = action.payload;
      })
      .addCase(fetchPracticedScenarios.rejected, (state, action) => {
        state.status.practicedScenarios = 'failed';
        state.error = action.payload;
      })
      // 기존 Reducer 로직
      .addCase(fetchBookmarks.pending, (state) => { state.status.bookmarks = 'loading'; })
      .addCase(fetchBookmarks.fulfilled, (state, action) => { state.status.bookmarks = 'succeeded'; state.bookmarks = action.payload; })
      .addCase(fetchBookmarks.rejected, (state, action) => { state.status.bookmarks = 'failed'; state.error = action.payload; })
      .addCase(fetchIncorrectNotes.pending, (state) => { state.status.incorrectNotes = 'loading'; })
      .addCase(fetchIncorrectNotes.fulfilled, (state, action) => { state.status.incorrectNotes = 'succeeded'; state.incorrectNotes[action.payload.scenarioId] = action.payload.data; })
      .addCase(fetchIncorrectNotes.rejected, (state, action) => { state.status.incorrectNotes = 'failed'; state.error = action.payload; })
      .addCase(saveUserMemo.pending, (state) => { state.status.incorrectNotes = 'saving'; })
      .addCase(saveUserMemo.fulfilled, (state, action) => { state.status.incorrectNotes = 'succeeded'; if(state.incorrectNotes[action.payload.scenarioId]) { state.incorrectNotes[action.payload.scenarioId].userMemo = action.payload.data.userMemo; } })
      .addCase(saveUserMemo.rejected, (state, action) => { state.status.incorrectNotes = 'failed'; state.error = action.payload; })
      .addCase(fetchLearningHistory.pending, (state) => { state.status.learningHistory = 'loading'; })
      .addCase(fetchLearningHistory.fulfilled, (state, action) => { state.status.learningHistory = 'succeeded'; state.learningHistory = action.payload; })
      .addCase(fetchLearningHistory.rejected, (state, action) => { state.status.learningHistory = 'failed'; state.error = action.payload; });
  },
});

export default myNotesSlice.reducer;