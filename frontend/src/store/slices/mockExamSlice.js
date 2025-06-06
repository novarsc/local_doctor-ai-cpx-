/**
 * @file mockExamSlice.js
 * @description Redux Toolkit slice for managing mock exam state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockExamService } from '../../services/mockExamService';

const initialState = {
  currentSession: null,
  history: [],
  status: 'idle', // 'idle' | 'loading' | 'active' | 'completed' | 'error'
  error: null,
};

// Existing async thunks (startNewMockExam, fetchMockExamSession) ...
export const startNewMockExam = createAsyncThunk('mockExam/startNew', async (config, { rejectWithValue }) => { try { return await mockExamService.startMockExam(config); } catch (e) { return rejectWithValue(e.message); }});
export const fetchMockExamSession = createAsyncThunk('mockExam/fetchSession', async (id, { rejectWithValue }) => { try { return await mockExamService.getMockExamSession(id); } catch (e) { return rejectWithValue(e.message); }});

// Async thunk for completing a mock exam session
export const completeMockExam = createAsyncThunk(
    'mockExam/complete',
    async (sessionId, { rejectWithValue }) => {
        try {
            return await mockExamService.completeMockExam(sessionId);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const mockExamSlice = createSlice({
  name: 'mockExam',
  initialState,
  reducers: {
    clearCurrentMockExam: (state) => {
      state.currentSession = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Existing lifecycles...
      .addCase(startNewMockExam.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(startNewMockExam.fulfilled, (state, action) => { state.status = 'active'; state.currentSession = action.payload; })
      .addCase(startNewMockExam.rejected, (state, action) => { state.status = 'error'; state.error = action.payload; })
      .addCase(fetchMockExamSession.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchMockExamSession.fulfilled, (state, action) => { state.status = 'active'; state.currentSession = action.payload; })
      .addCase(fetchMockExamSession.rejected, (state, action) => { state.status = 'error'; state.error = action.payload; })
      
      // New lifecycle for completing a mock exam
      .addCase(completeMockExam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(completeMockExam.fulfilled, (state, action) => {
        state.status = 'completed';
        state.currentSession = action.payload; // Update with the final session data including score
      })
      .addCase(completeMockExam.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      });
  },
});

export const { clearCurrentMockExam } = mockExamSlice.actions;

export default mockExamSlice.reducer;
